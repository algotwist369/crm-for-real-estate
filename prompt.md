You are a senior full-stack engineer (Node.js, Express, MongoDB) with strong experience in SaaS CRM systems, event-driven architecture, and role-based access control.

Carefully read and analyze my ENTIRE backend codebase before making any changes.

IMPORTANT RULES:
- Do NOT break existing functionality
- Do NOT duplicate logic
- Reuse existing notification/email services
- Follow current project structure and coding standards
- Write clean, modular, scalable, production-ready code

------------------------------------------------

🎯 PROBLEM STATEMENT:

My system has:
- Admin
- Multiple Agents under admin
- Properties
- Leads linked to properties

Each property can be assigned to MULTIPLE agents.

Now the requirement is:

👉 Notifications (email notifications) for leads should be LIMITED ONLY to agents assigned to that specific property (NOT all agents under admin).

------------------------------------------------

✅ REQUIRED SOLUTION:

Implement a PROPERTY-BASED LEAD NOTIFICATION SYSTEM

------------------------------------------------

📌 CORE LOGIC (VERY IMPORTANT):

Each property has:
→ assignedAgents: [agentIds]

When a lead is created for a property:

👉 ONLY notify:
   - Agents assigned to that property
   - Admin (optional but recommended)

👉 DO NOT notify:
   - Agents NOT assigned to that property

------------------------------------------------

📩 NOTIFICATION RULES:

------------------------------------------------

1️⃣ NEW LEAD CREATED FOR PROPERTY

CASE A: Admin creates lead

→ Notify:
   - ONLY agents assigned to that property

→ DO NOT notify:
   - Admin (creator)
   - Unassigned agents

------------------------------------------------

CASE B: Agent creates lead

→ Notify:
   - Admin
   - OTHER agents assigned to that property

→ DO NOT notify:
   - Creator agent
   - Unassigned agents

------------------------------------------------

🎯 FINAL RULE:

👉 Notifications = ONLY assigned agents of that property + admin (if applicable)

👉 NEVER notify:
   - Creator
   - Unassigned agents

------------------------------------------------

2️⃣ LEAD ASSIGNMENT (OPTIONAL)

→ Notify ONLY the assigned agent

------------------------------------------------

3️⃣ LEAD STATUS UPDATE (OPTIONAL)

→ Notify:
   - Admin
   - Assigned agents of that property

→ Exclude:
   - Actor (who triggered update)

------------------------------------------------

------------------------------------------------

🔐 AUTHENTICATION & MULTI-TENANT SECURITY:

- Use existing auth middleware (JWT/session)
- Ensure:
   → Data is scoped per admin
   → No cross-admin notifications

- Always validate:
   → property belongs to same admin
   → agents belong to same admin

------------------------------------------------

⚙️ IMPLEMENTATION REQUIREMENTS:

1️⃣ Understand Data Relationships:

- Property:
   → assignedAgents: [agentIds]

- Lead:
   → propertyId

------------------------------------------------

2️⃣ Fetch Recipients:

When lead is created:

- Get propertyId from lead
- Fetch property:
   → Get assignedAgents[]

- Query users:
   → WHERE _id IN assignedAgents
   → AND adminId = currentAdmin

- Apply filtering:
   → Exclude creator

------------------------------------------------

3️⃣ Notification Service:

Create/extend:

services/notification.service.js

Functions:

- notifyLeadCreatedByAdmin()
- notifyLeadCreatedByAgent()
- notifyLeadUpdate()

------------------------------------------------

4️⃣ Async Processing:

- Use Promise.all OR queue (Bull/Redis if exists)
- Do NOT block API response

------------------------------------------------

5️⃣ Code Structure:

- controllers/lead.controller.js
- services/lead.service.js
- services/notification.service.js

------------------------------------------------

⚠️ EDGE CASES:

Handle:

- Property has NO assigned agents
   → Notify ONLY admin

- Agent not assigned but tries action
   → Validate permissions (optional)

- Duplicate notifications
- Invalid users/emails
- Bulk lead creation

------------------------------------------------

🧪 VALIDATION:

- Ensure ONLY assigned agents are notified
- Ensure creator is excluded
- Ensure no cross-property notifications
- Ensure no cross-admin data leak

------------------------------------------------

📌 EXPECTED OUTPUT:

- Property-based notification filtering implemented
- Clean recipient selection logic
- Secure multi-tenant handling
- Optimized queries
- Clean, readable, production-ready code

------------------------------------------------

⚠️ FINAL INSTRUCTION:

Before writing code:
- Understand property-agent relationship deeply
- Understand current lead flow
- Extend logic cleanly without rewriting everything

Think like a senior engineer building a scalable CRM like HubSpot or Zoho with property-level access control.