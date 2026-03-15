Core Agent Account

- get_me (agent profile + agent stats)
- update_my_profile (name, phone/email (optional), profile_pic upload to Cloudinary like admin profile)
- change_my_password
- logout (blacklist token like admin)
Assigned Properties (Agent Workspace)

- get_my_assigned_properties (pagination + filters: status/type/city/search)
- get_my_assigned_property_by_id (only if assigned)
- update_my_assigned_property (allowed fields only, same rule you used in property.controller for agents)
- add_property_photos / remove_property_photo (Cloudinary URLs)
- request_assign_other_agent_to_property (creates a request/notification for admin OR directly adds if you allow team-lead agents)
Leads (Most Important for Agents)

- get_my_leads (filters: status/priority/follow_up_due/search)
- get_lead_by_id (only if assigned)
- create_lead (optional depending on business flow)
- update_lead (status, priority, requirement, budget, notes, tags)
- add_lead_note (append interaction notes)
- set_follow_up (date + status + remarks + followed_by)
- mark_lead_converted / mark_lead_lost (with reason)
Follow-ups / Tasks

- get_my_followups (today/overdue/upcoming)
- complete_followup / reschedule_followup
Dashboard / Reports

- agent_dashboard_summary (counts: total leads, follow-ups due, conversions, lost, active properties)
- agent_activity_timeline (recent actions)
Notifications (Internal CRM)

- get_my_notifications
- mark_notification_read
- clear_notifications
Recommended minimum for your current codebase Given what you already built (auth, token blacklist, Cloudinary uploader, properties/leads models), the best next “minimal but complete” agent.controller.js would include:

- update agent own profile (with profile pic upload)
- get assigned properties (pagination + filters)
- update assigned property (agent-only allowed fields)
- get my leads + set follow-up + update lead status
- logout + change password (same pattern as admin)
If you want, I can implement agent.controller.js now following the same patterns we used in auth.controller.js , admin.controller.js , and property.controller.js (auth via Bearer token + blacklist check + agent ownership checks + Cloudinary uploads).