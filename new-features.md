1. Feature Scope

User can:

Connect Facebook Page.
Connect Instagram Business/Creator account.
Create post manually.
Generate caption using OpenAI.
Upload image/video.
Publish immediately.
Schedule post.
Track every status.
Retry failed jobs.
Delete media from storage after successful publish.

Required Meta permissions may include:

pages_show_list, pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish.

Meta permission review is required for production use. Meta’s permissions reference specifically includes instagram_content_publish for creating and publishing organic Instagram content.

2. Recommended Architecture
CRM Existing DB
   |
   | user_id / org_id reference
   v
Social Media DB: MONGO_DB_URL_SOCIAL_MEDIA
   |
   |-- social_accounts
   |-- social_posts
   |-- social_media_assets
   |-- social_post_jobs
   |-- social_ai_captions
   |-- social_webhook_events
   |-- social_audit_logs

Backend API
   |
   |-- Auth Middleware
   |-- Social Account Service
   |-- Meta OAuth Service
   |-- Post Service
   |-- AI Caption Service
   |-- Media Upload Service
   |-- Queue Producer

Redis + BullMQ
   |
   |-- publish_now_queue
   |-- scheduled_post_queue
   |-- retry_failed_post_queue
   |-- media_cleanup_queue
   |-- token_refresh_queue

Workers
   |
   |-- Facebook Publish Worker
   |-- Instagram Publish Worker
   |-- Media Cleanup Worker
   |-- Retry Worker
   |-- Token Health Worker

Meta Graph API
OpenAI API
Storage: S3 / Cloudinary / GCP Storage
3. Status Flow

Use strict status tracking:

draft
caption_generating
caption_generated
media_uploaded
scheduled
queued
processing
publishing_to_meta
published
failed_retryable
failed_permanent
cancelled
expired_token
rate_limited
media_cleanup_pending
media_deleted

Never depend only on BullMQ status. Store your own status in MongoDB.

4. Main Failure Conditions and Solutions
A. User Connection Failures
1. User denies Meta permission

Failure: User clicks connect but does not approve required scopes.

Solution:

Show missing permission list.

Facebook connection failed because required permissions were not approved:
pages_manage_posts, instagram_content_publish

Save status:

connection_status: "permission_denied"
2. User connects personal Instagram account

Failure: Instagram publishing works only for supported professional accounts depending on API path.

Solution:

Validate account type after connection.

if account_type not in ["BUSINESS", "CREATOR"]:
    block publishing

Show:

Please convert your Instagram account to Business or Creator account.
3. Facebook Page not linked with Instagram

Failure: Instagram publishing needs a valid connected Instagram account in many Graph API flows.

Solution:

During connection, fetch pages and linked Instagram accounts.

Store:

{
  facebook_page_id,
  instagram_business_account_id,
  is_instagram_connected: true
}

If missing, show setup instructions.

4. Token expires

Failure: Post fails at scheduled time because token expired.

Solution:

Run daily token health check.

Before scheduling/posting:

Check token validity.
If invalid, mark post as expired_token.
Notify user.
Do not retry blindly.
5. User removes app access from Meta

Failure: Token was valid earlier but revoked later.

Solution:

Detect Meta auth error.

Mark account:

connection_status: "revoked"

Notify user to reconnect.

B. AI Caption Failures
6. OpenAI API timeout

Failure: Caption generation takes too long.

Solution:

Use timeout and fallback.

Retry 2 times.
If failed, allow manual caption.

Status:

caption_failed
7. AI generates unsafe/wrong caption

Failure: Bad or irrelevant caption.

Solution:

Never auto-post AI caption without user review unless user explicitly enables auto mode.

Store:

caption_source: "ai" | "manual"
caption_approved: true | false
8. OpenAI rate limit

Failure: Too many caption requests.

Solution:

Use separate BullMQ queue:

ai_caption_queue

Apply:

per_user_limit
per_org_limit
global_limit
C. Media Upload Failures
9. Unsupported image/video format

Failure: Meta rejects file.

Solution:

Validate before upload.

Allowed examples:

image/jpeg
image/png
video/mp4

Also validate size, duration, aspect ratio, resolution.

10. Upload succeeds but DB save fails

Failure: Media exists in storage but no DB record.

Solution:

Use compensating cleanup job.

Flow:

1. Upload media
2. Save DB record
3. If DB save fails, delete uploaded media
11. DB save succeeds but upload fails

Failure: Post has broken media reference.

Solution:

Create media record only after successful upload, or mark:

media_status: "upload_failed"
12. Media deleted before scheduled post

Failure: Cleanup runs too early.

Solution:

Only delete media after:

post_status === "published"

Never delete media for:

scheduled
queued
processing
failed_retryable
D. Scheduling Failures
13. User schedules post in past

Solution:

Validate:

scheduled_at > current_time + minimum_buffer

Use server time, not browser time.

14. Timezone mismatch

Failure: User schedules 10 AM but post goes at wrong time.

Solution:

Store both:

scheduled_at_utc
user_timezone
display_time

Always process in UTC.

15. Redis/BullMQ delayed job lost

Failure: Redis restart or queue issue.

Solution:

Do not depend only on delayed BullMQ jobs.

Add DB scheduler scanner:

Every 1 minute:
Find posts where status=scheduled and scheduled_at_utc <= now
Push to queue if not already queued

This prevents missed posts.

16. Duplicate scheduled job

Failure: Same post publishes twice.

Solution:

Use idempotency key.

job_id = `publish:${post_id}`

BullMQ:

queue.add("publish_post", data, {
  jobId: `publish:${post_id}`
})

MongoDB:

publish_lock: true
published_at: null

Before publishing:

If already published, skip.
E. Publishing Failures
17. Meta API rate limit

Failure: Meta rejects due to rate limits.

Solution:

Use exponential backoff.

Retry after delay.
Respect Retry-After header if available.
Mark status: rate_limited.

Meta confirms Graph API requests can fail after rate limits are reached.

18. Temporary Meta API failure

Failure: 500/502/503 from Meta.

Solution:

Retry safely:

Attempt 1: after 1 min
Attempt 2: after 5 min
Attempt 3: after 15 min
Attempt 4: after 1 hour

After max retries:

failed_retryable or failed_permanent
19. Permanent Meta validation error

Failure: Bad media, bad caption, missing permission.

Solution:

Do not retry.

Mark:

failed_permanent

Save exact error:

meta_error_code
meta_error_message
meta_error_subcode
20. Instagram two-step publishing fails

Instagram publishing usually has two steps:

1. Create media container
2. Publish media container

Failure: Container created but publish fails.

Solution:

Store:

meta_container_id

Retry publish step only, not full upload, if valid.

21. Facebook published but Instagram failed

Failure: Multi-platform post partially succeeds.

Solution:

Track per platform status.

platform_results: [
  {
    platform: "facebook",
    status: "published",
    meta_post_id: "..."
  },
  {
    platform: "instagram",
    status: "failed_retryable",
    error: "..."
  }
]

Do not mark whole post simply as failed. Use:

partially_published
22. User deletes connected page before scheduled post

Solution:

Before publishing, verify account/page still accessible.

If not:

failed_permanent
reason: page_not_accessible
23. Duplicate publish due to worker crash

Failure: Worker publishes to Meta but crashes before DB update.

Solution:

This is serious.

Use:

idempotency lock
platform_publish_attempt record
external_meta_post_id storage

After Meta response, update DB immediately.

Also use reconciliation job:

Check posts stuck in publishing_to_meta for more than 10 minutes.
Verify with Meta if possible.
F. Queue/Worker Failures
24. Redis down

Failure: Queue unavailable.

Solution:

API should not crash.

Save post as scheduled/pending_queue.
Return message: Post saved, publishing queue temporarily delayed.

Recovery scanner pushes pending posts when Redis returns.

25. Worker down

Failure: Jobs remain waiting.

Solution:

Run multiple workers:

social-worker-1
social-worker-2
social-worker-3

Use process manager:

PM2 / Docker / ECS / Kubernetes later

Add health checks.

26. Job stuck in active

Solution:

Use BullMQ stalled job handling.

Also maintain DB timeout:

If processing for > 15 minutes, mark as stuck and requeue.
27. Too many jobs at once

Failure: 100k users schedule posts at same time.

Solution:

Use queue partitioning:

facebook_publish_queue
instagram_publish_queue
media_cleanup_queue
caption_queue

Use concurrency limits:

concurrency: 20

Use per-user and per-platform rate limiter.

G. Database Failures
28. Social DB unavailable

Failure: MONGO_DB_URL_SOCIAL_MEDIA connection fails.

Solution:

Use separate DB connection with retry.

Do not crash main CRM.
Disable social module temporarily.
29. Existing CRM DB and social DB relation breaks

Failure: User deleted from main CRM but social records remain.

Solution:

Use soft references:

crm_user_id
crm_org_id
crm_role

Add sync/cleanup job:

If CRM user inactive, disable social posting.
30. No transaction across two databases

Failure: Existing DB update succeeds but social DB update fails.

Solution:

Avoid cross-database transactions where possible.

Use event-style sync:

CRM emits user_created/user_deleted/org_updated
Social DB stores mirrored minimal user/org info
H. Security Failures
31. Access token leak

Solution:

Encrypt tokens before saving.

AES-256-GCM

Never log tokens.

Store:

access_token_encrypted
token_last_4
expires_at
32. Agent posts from another user’s account

Solution:

Every query must include:

org_id
user_id
role

Never fetch by only _id.

33. Broken authorization

Solution:

Create permission matrix:

admin: connect accounts, post, schedule, delete
manager: post, schedule
agent: create draft only
34. Webhook spoofing

Solution:

Verify Meta webhook signature.

Reject invalid signatures.

I. Storage Cleanup Failures
35. Media deletion fails after publish

Solution:

Do not block publish success.

Create cleanup job:

media_cleanup_pending

Retry deletion separately.

36. Accidentally deleting media before retry

Solution:

Cleanup condition:

Delete only if all selected platforms are published OR failed_permanent and user confirms cleanup.
J. Frontend Failures
37. User refreshes during upload

Solution:

Use resumable upload or save draft before upload.

38. User clicks publish multiple times

Solution:

Disable button after first click.

Backend idempotency:

client_request_id
39. Status not updating live

Solution:

Use polling or WebSocket.

Simple production-safe option:

Frontend polls /posts/:id/status every 5 seconds while processing.
5. Suggested MongoDB Schemas
social_accounts
{
  crm_user_id,
  crm_org_id,
  platform: "facebook" | "instagram",
  facebook_page_id,
  instagram_business_account_id,
  account_name,
  username,
  access_token_encrypted,
  token_expires_at,
  permissions: [],
  connection_status: "connected",
  last_token_check_at,
  created_at,
  updated_at
}
social_posts
{
  crm_user_id,
  crm_org_id,
  caption,
  caption_source: "manual" | "ai",
  media_ids: [],
  platforms: ["facebook", "instagram"],
  schedule_type: "now" | "scheduled",
  scheduled_at_utc,
  user_timezone,
  status,
  platform_results: [],
  retry_count,
  max_retries,
  last_error,
  publish_lock,
  published_at,
  created_at,
  updated_at
}
social_media_assets
{
  crm_user_id,
  crm_org_id,
  post_id,
  storage_provider: "s3",
  file_url,
  file_key,
  mime_type,
  file_size,
  media_type: "image" | "video",
  status: "uploaded" | "deleted" | "delete_failed",
  created_at,
  deleted_at
}
social_post_jobs
{
  post_id,
  job_id,
  queue_name,
  status,
  attempts,
  next_retry_at,
  last_error,
  created_at,
  updated_at
}
6. Retry Strategy

Use retry only for temporary errors.

Retryable:

Meta 500/502/503
Network timeout
Rate limit
Redis temporary failure
Storage temporary failure

Not retryable:

Invalid token
Missing permission
Unsupported media
Invalid caption
Page not found
Instagram account not connected
User cancelled post

Recommended BullMQ config:

{
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 60000
  },
  removeOnComplete: false,
  removeOnFail: false
}
7. Production API Routes
POST   /api/social/connect/facebook
GET    /api/social/connect/facebook/callback
GET    /api/social/accounts
DELETE /api/social/accounts/:account_id

POST   /api/social/captions/generate
POST   /api/social/media/upload
DELETE /api/social/media/:media_id

POST   /api/social/posts
GET    /api/social/posts
GET    /api/social/posts/:post_id
GET    /api/social/posts/:post_id/status
PATCH  /api/social/posts/:post_id
DELETE /api/social/posts/:post_id

POST   /api/social/posts/:post_id/publish-now
POST   /api/social/posts/:post_id/schedule
POST   /api/social/posts/:post_id/cancel
POST   /api/social/posts/:post_id/retry