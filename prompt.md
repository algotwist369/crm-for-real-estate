Analyze the existing codebase first and understand the current authentication, authorization, admin, agent, property, and lead management flow before making any changes.

Task Requirement

Implement and/or verify the following role-based access control and ownership logic:

Scenario

If AdminA creates 3 Agents and also creates PropertyA, then assigns all 3 agents to PropertyA:

Property Access Rules

All assigned agents of PropertyA should be able to:

Create
Read
Update
Delete

operations for PropertyA, based on the business rule.

Also, AdminA should always retain full access to PropertyA.

Lead Access Rules

If any assigned agent creates a Lead for PropertyA, then that lead should be accessible by:

AdminA
All agents assigned to PropertyA
The agent who created the lead
These users should be able to perform full:
Create
Read
Update
Delete

operations on that Lead, as per the business logic.

Expected Authorization Logic

Implement or verify the following permission rules:

For Properties

A user can access a property if:

The user is the Admin who created the property
OR the user is an Agent assigned to that property
For Leads

A user can access a lead if:

The user is the Admin who owns the property linked to that lead
OR the user is an Agent assigned to that property
OR the user is the Agent who created the lead

Important: Since the lead belongs to a property, all agents assigned to that property should have access to that lead.

Implementation Instructions

Please do the following carefully:

Read and understand the current codebase first
Existing models
Controllers
Routes
Middleware
Auth flow
Role system
Property assignment logic
Lead ownership/access logic
Do not create unnecessary new files
Reuse and improve the current architecture
Only create a new file if absolutely necessary
Update the existing code properly
Add missing authorization checks
Fix broken ownership logic
Ensure consistent permission handling across APIs
Keep the implementation production-ready
Clean code
Reusable helper functions/middleware if needed
Avoid duplicate authorization logic
What to Check / Build

Please verify or implement:

Property Module
Property creation by Admin
Assigning multiple agents to a property
Property CRUD access for assigned agents
Admin ownership validation
Lead Module
Lead creation under a property
Lead visibility for all assigned agents of that property
Lead CRUD access for Admin + all assigned agents
Proper creator/ownership tracking
Important Edge Cases

Handle these cases properly:

An unassigned agent must not access PropertyA
An unassigned agent must not access leads of PropertyA
If an agent is removed from PropertyA assignment, they should lose access to:
that property
all leads related to that property
If AdminA owns the property, another admin should not automatically get access
Ensure no unauthorized user can modify or delete unrelated data
Expected Output

After completing the task, provide:

1. What you changed
Files updated
Logic added/modified
2. Access control summary

Explain clearly:

Who can access properties
Who can access leads
Why
3. API test scenarios

Give test cases for:

Admin creates property
Admin assigns agents
Assigned agent updates property
Unassigned agent denied
Assigned agent creates lead
Other assigned agent accesses same lead
Removed agent denied access
4. If there is any issue in current architecture

Mention:

security issue
scalability issue
bad access control pattern
recommended improvement
Important Rule

Do not blindly rewrite the whole module.

First:

inspect current code
understand relationships
then apply minimal but correct changes

The final implementation must be secure, scalable, and logically correct.