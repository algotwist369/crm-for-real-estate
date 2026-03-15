# LeadReal Backend (Internal Real-Estate CRM)

This backend is an internal CRM for a real-estate consultancy. It provides:

- Authentication (admin + agent) with token-based auth
- Agent management (admin creates/manages agents)
- Property management (admin + agent, with role-based access rules)
- Lead management (admin + agent, with follow-up scheduling)
- Email notifications on new properties and new leads
- Email notifications for follow-ups (1 hour and 5 minutes before due time)
- Cloudinary image uploads (profile pics + property photos)

The codebase uses:

- Node.js (CommonJS)
- Express (installed; routing/server wiring is expected to live outside controllers)
- MongoDB + Mongoose

## Environment Variables

### Auth

- `TOKEN_SECRET` (or `JWT_SECRET`): required (min 16 chars)

### Cloudinary

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` (optional default folder)
- `CLOUDINARY_PROFILE_FOLDER` (optional; profile pics folder)
- `CLOUDINARY_PROPERTY_FOLDER` (optional; property photos folder)

### Email (SMTP)

- `MAIL_HOST`
- `MAIL_PORT` (default `587`)
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_SECURE` (optional: `"true"` for port 465)
- `MAIL_FROM` (optional; defaults to `MAIL_USER`)
- `APP_NAME` (optional; defaults to `LeadReal`)
- `APP_URL` (optional; used to generate deep-links in emails)

## Response Shape (API Convention)

Success responses generally return:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {},
  "pagination": {}
}
```

Error responses are handled by middleware and return:

```json
{
  "success": false,
  "message": "Validation error",
  "details": [
    { "path": "email", "message": "Valid email is required" }
  ]
}
```

In non-production environments, the error response may also include `stack`.

## Auth Flow

### Token Format

Tokens are signed using HMAC-SHA256 and contain:

- `sub`: user id
- `role`: `admin | super_admin | agent`
- `email`: user email
- `iat`, `exp`

Utilities:

- [generateToken.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/utils/generateToken.js)

### Token Blacklist (Logout / Password Change)

On logout and password change, the current token is blacklisted.
Blacklisted tokens cannot access protected endpoints.

- Model: [tokenBlacklist.model.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/model/tokenBlacklist.model.js)
- TTL: entries automatically expire based on `expires_at`

## Cloudinary Upload Utilities

Uploads support:

- Buffer (recommended with memory uploads)
- File path
- Data URI
- Base64 string

Utility:

- [uploadImage.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/utils/uploadImage.js)

## Email Templates + Sender

Templates:

- [utils/templates](file:///c:/Users/ADMIN/Desktop/lead_real/backend/utils/templates/index.js)

Sender:

- [sendMail.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/utils/sendMail.js)

Example:

```js
const { sendMail } = require('./utils/sendMail');

await sendMail({
  to: 'user@example.com',
  template: 'followUpReminder',
  templateData: {
    leadName: 'Arjun Khanna',
    followUpDate: '2026-03-20',
    leadUrl: 'https://crm.example.com/leads/LEAD_ID'
  }
});
```

## Controllers (Business Logic)

Controllers implement business rules. Routes should call controller methods and the global error handler middleware should be mounted once.

### Auth Controller

File: [auth.controller.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/controller/auth.controller.js)

Functions:

- `register_admin`: register a new admin
- `login_admin`: login using phone or email
- `update_admin_profile`: update profile fields + profile pic upload
- `logout_admin`: blacklist token
- `change_password`: change password + blacklist old token

#### Register Admin (Example)

Request body:

```json
{
  "user_name": "Admin",
  "email": "admin@example.com",
  "phone_number": "9876543210",
  "password": "Admin1234"
}
```

Response:

```json
{
  "success": true,
  "message": "Admin registered successfully",
  "token": "...",
  "user": { "_id": "...", "user_name": "Admin", "email": "admin@example.com", "phone_number": "9876543210", "role": "admin" }
}
```

#### Login Admin (Example)

Request body:

```json
{
  "phone_or_email": "admin@example.com",
  "password": "Admin1234"
}
```

### Admin Controller (Agent Management)

File: [admin.controller.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/controller/admin.controller.js)

All endpoints require admin auth (`admin | super_admin`).

Functions:

- `get_all_agents`: pagination + filters + search
- `get_agent_by_id`
- `create_agent`: creates both User(role=agent) and Agent; supports profile pic upload
- `update_agent`: updates both User + Agent (full update)
- `update_agent_status`: toggles active/inactive (syncs to user)
- `assign_project_to_agent`: stores a project id into `agent.assigned_projects`
- `remark_agent`
- `delete_agent`: soft delete (agent inactive, user is_deleted)

#### Create Agent (Example)

Request body:

```json
{
  "name": "Rahul Sharma",
  "role": "Senior Agent",
  "email": "rahul.sharma@example.com",
  "phone": "9876543210",
  "pin": "1234"
}
```

Response includes generated initial credentials:

```json
{
  "success": true,
  "message": "Agent created successfully",
  "data": { "agent_pin": 1234, "agent_role": "Senior Agent", "agent_details": { "user_name": "Rahul Sharma" } },
  "credentials": { "phone_number": "9876543210", "email": "rahul.sharma@example.com", "password": "..." }
}
```

### Property Controller (Properties)

File: [property.controller.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/controller/property.controller.js)

Roles:

- Admin: full access
- Agent: only properties assigned to that agent

Functions:

- `get_all_properties`: pagination + filter + search
- `get_property_by_id`
- `create_property`: admin/agent; minimal internal-required fields (`title` + `listing_type`)
- `update_property`: admin/agent; agent cannot reassign agents
- `update_property_status`: supports `is_active` and/or `property_status`
- `delete_property`: soft delete (inactive)

#### New Property Email Notification

After a property is created, the backend sends an email to all active agents (users with `role: agent` and a valid `email`).

- Template: `genericNotification`
- Trigger: `create_property` (runs asynchronously after the API response)
- Deep link: `${APP_URL}/properties/<propertyId>` (requires `APP_URL`)

#### Create Property (Minimal Example)

```json
{
  "title": "2BHK near Metro",
  "listing_type": "rent"
}
```

Optional fields include: price, currency, address, city/state, bedrooms/bathrooms, photos, amenities, etc.

#### Property Status Update Examples

Set active/inactive:

```json
{ "is_active": false }
```

Set status:

```json
{ "property_status": "sold" }
```

### Agent Controller (Agent Self-Service)

File: [agent.controller.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/controller/agent.controller.js)

Functions:

- `update_agent_own_profile`: updates own user profile + profile pic upload
- `get_all_assigned_properties`: list properties assigned to the agent
- `assign_other_agent_to_property`: add another agent to a property (only if property is already assigned to the agent)

### Lead Controller (Leads + Follow-ups)

File: [lead.controller.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/controller/lead.controller.js)

Roles:

- Admin: full access
- Agent: only leads assigned to that agent (via `assigned_to`)

Functions:

- `get_my_leads`: filter by status/priority/search/follow_up_due
- `get_lead_by_id`
- `create_lead`
- `update_lead`
- `add_lead_note`
- `set_follow_up`: schedules reminders
- `mark_lead_converted`
- `mark_lead_lost`
- `get_my_followups`: today/overdue/upcoming
- `complete_followup`
- `reschedule_followup`
- `agent_dashboard_summary`
- `agent_activity_timeline`

#### Follow-up Notifications (Important Flow)

When `set_follow_up` is called:

1. Lead is updated with:
   - `next_follow_up_date`
   - `follow_up_status` (`pending` / `rescheduled`)
   - `followed_by`
   - optional `remarks`
2. The system schedules 2 reminder emails:
   - 1 hour before due time
   - 5 minutes before due time
3. Recipients include:
   - All admins (`admin`, `super_admin`)
   - All agents assigned to any property listed in `lead.properties`
   - All users in `lead.assigned_to`
   - Lead creator and the current action user
4. If any agent completes the follow-up or marks the lead lost/converted, pending reminders are cancelled.

#### New Lead Email Notification (Agent Created)

When an agent creates a lead, the backend sends an email notification to:

- All admins (`admin`, `super_admin`)
- All users in `lead.assigned_to`

Notes:

- This runs asynchronously after the API response.
- Template: `leadAssigned`
- Deep link: `${APP_URL}/leads/<leadId>` (requires `APP_URL`)

Reminder storage:

- Model: [followUpReminder.model.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/model/followUpReminder.model.js)
- Worker: [followUpReminderWorker.js](file:///c:/Users/ADMIN/Desktop/lead_real/backend/jobs/followUpReminderWorker.js)

#### set_follow_up Example

Request:

```json
{
  "next_follow_up_date": "2026-03-20T10:00:00.000Z",
  "follow_up_status": "pending",
  "remarks": "Call after 4 days and share updated options"
}
```

Response:

```json
{
  "success": true,
  "message": "Follow-up updated successfully",
  "data": { "_id": "...", "follow_up_status": "pending", "next_follow_up_date": "..." }
}
```

## Running the Follow-up Email Worker

The worker must be started by your server entry file after connecting to MongoDB:

```js
const { startFollowUpReminderWorker } = require('./jobs/followUpReminderWorker');

const worker = startFollowUpReminderWorker({ pollIntervalMs: 60000, maxPerTick: 25 });
worker.start();
```

## API Testing (cURL Examples)

These are example requests. Your actual route paths may differ depending on how you wire routers.

### Admin Login

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"phone_or_email":"admin@example.com","password":"Admin1234"}'
```

### Authenticated Request

```bash
curl http://localhost:3000/api/properties?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Lead

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Arjun Khanna","email":"arjun.k@example.com","phone":"9876543210","requirement":"3BHK Flat","budget":"₹1.5Cr","inquiry_for":"buying","source":"facebook"}'
```

### Set Follow-up

```bash
curl -X POST http://localhost:3000/api/leads/LEAD_ID/followup \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"next_follow_up_date":"2026-03-20T10:00:00.000Z","follow_up_status":"pending","remarks":"Call after 4 days"}'
```

## Notes for Future Developers

- Controllers are written to be route-agnostic. Build routers in `backend/routes/*` and mount them in your Express app.
- Token blacklist must be checked on any protected endpoint.
- When adding new models, add indexes early (high-traffic queries are: leads by status/assigned_to/follow_up due, properties by status/type/agent).
- Follow-up reminders are scheduled into Mongo and processed by a worker; do not attempt `setTimeout` scheduling per lead.
