You are a senior full-stack engineer (Node.js, Express, MongoDB, Redis/Queue systems) with strong experience in SaaS CRM systems, background jobs, and event-driven architecture.

Carefully read and analyze my ENTIRE backend codebase before making any changes.

IMPORTANT RULES:
- Do NOT break existing functionality
- Do NOT duplicate logic
- Reuse existing notification/email services
- Follow current project architecture and coding standards
- Write clean, modular, scalable, production-ready code

------------------------------------------------

🎯 PROBLEM STATEMENT:

My system has a Follow-Up Leads section where:
- Admin or assigned agent can set a follow-up date & time for a lead

Currently:
- No proper reminder system exists OR it is incomplete

------------------------------------------------

✅ REQUIRED SOLUTION:

Implement a COMPLETE FOLLOW-UP REMINDER SYSTEM or UPDATE EXISTING ONE with:

1) Immediate notification (when follow-up is created)
2) Scheduled reminder (1 hour before follow-up time)

------------------------------------------------

📌 CORE REQUIREMENT:

When a follow-up is created:

👉 Send IMMEDIATE email notification to:
   - Assigned agent(s) of that lead/property
   - Admin

👉 Then schedule another reminder:
   - 1 hour BEFORE follow-up date & time

------------------------------------------------

📩 NOTIFICATION RULES:

------------------------------------------------

1️⃣ IMMEDIATE NOTIFICATION (ON FOLLOW-UP CREATE)

Trigger:
→ When follow-up is created

Notify:
- Admin
- Assigned agent(s)

Exclude:
- Creator (if required based on your system rules)

------------------------------------------------

2️⃣ SCHEDULED REMINDER (1 HOUR BEFORE)

Trigger:
→ followUpDateTime - 1 hour

Notify:
- Admin
- Assigned agent(s)

------------------------------------------------

🎯 FINAL RULE:

- Notifications should be:
   → Property-based (use assigned agents)
   → Lead-based (use lead assignment if exists)
- Never notify unrelated users

------------------------------------------------

🔐 AUTHENTICATION & SECURITY:

- Use existing auth middleware
- Ensure:
   → Follow-up belongs to correct admin
   → No cross-admin data access

------------------------------------------------

⚙️ IMPLEMENTATION REQUIREMENTS:

------------------------------------------------

1️⃣ Understand Data Relationships:

- Lead:
   → propertyId
   → assignedAgent(s) (if exists)

- Property:
   → assignedAgents

- FollowUp:
   → leadId
   → followUpDateTime

------------------------------------------------

2️⃣ Recipient Logic:

- Get lead → propertyId
- Get property → assignedAgents[]
- Include:
   → assignedAgents
   → admin
- Exclude:
   → creator (optional based on rules)

------------------------------------------------

3️⃣ Immediate Email:

- Trigger inside follow-up creation API
- Use existing email service

------------------------------------------------

4️⃣ Scheduled Reminder System (VERY IMPORTANT):

Use a background job system:

IF already using:
→ Bull / BullMQ (Redis)

ELSE:
→ Implement with node-cron OR queue-based system

------------------------------------------------

5️⃣ Scheduling Logic:

When follow-up is created:

- Calculate:
   reminderTime = followUpDateTime - 1 hour

- Schedule a job:
   → Send reminder email at reminderTime

------------------------------------------------

6️⃣ Job Queue Structure:

Create:

- queues/followup.queue.js
- jobs/followupReminder.job.js

Job payload:
{
  leadId,
  followUpId,
  adminId
}

------------------------------------------------

7️⃣ Email Content:

Include:
- Lead details
- Property name
- Follow-up date & time
- Assigned agent name

------------------------------------------------

8️⃣ Edge Case Handling:

- If follow-up time < 1 hour from now:
   → Send reminder immediately OR skip scheduling

- If follow-up updated:
   → Cancel previous job
   → Schedule new job

- If follow-up deleted:
   → Cancel scheduled job

------------------------------------------------

9️⃣ Performance:

- Do NOT block API response
- Use async job processing
- Avoid duplicate scheduling

------------------------------------------------

🔁 OPTIONAL (ADVANCED):

- Add multiple reminders:
   → 24 hours before
   → 1 hour before

- Add notification logs

------------------------------------------------

🧪 VALIDATION:

- Ensure correct recipients
- Ensure no duplicate emails
- Ensure job runs at correct time
- Ensure timezone handling is correct

------------------------------------------------

📌 CODE STRUCTURE:

- controllers/followup.controller.js
- services/followup.service.js
- services/notification.service.js
- queues/followup.queue.js
- jobs/followupReminder.job.js

------------------------------------------------

📌 EXPECTED OUTPUT:

- Immediate follow-up notification working
- Scheduled reminder (1 hour before) working
- Queue-based background processing
- Clean, scalable architecture
- Proper recipient filtering (property-based)
- Secure multi-tenant handling

------------------------------------------------

⚠️ FINAL INSTRUCTION:

Before writing code:
- Understand follow-up schema
- Understand lead → property → agent relationship
- Understand current email system

Extend existing system cleanly.

Think like a senior engineer building a CRM reminder system like HubSpot/Zoho.