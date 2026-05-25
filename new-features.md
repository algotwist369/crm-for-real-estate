I want to add two major production-grade modules into my Real Estate CRM:

1. Real-Time Communication System
2. Advanced Task Management System (Trello-style)

The architecture, scalability, security, UI/UX, and performance must be designed like a modern SaaS platform used by large teams.

====================================================

1. REAL-TIME CHAT & COMMUNICATION SYSTEM
   ====================================================

Build a fully real-time chat system for Admins and Agents.

---

## Core Requirements

* Use WebSockets (Socket.IO preferred) for instant communication.
* Real-time messaging must be:

  * Smooth
  * Low latency
  * Highly scalable
  * Production-ready
* Handle large concurrent users without lag or delays.

---

## User Communication Rules

Admin can chat with:

* Any agent under their organization/company

Agents can chat with:

* Admin
* Other agents under the same organization/company

No unauthorized cross-company communication should ever be possible.

---

## Chat UI Requirements

Add a floating chat icon at the bottom-right corner of the CRM.

On click:

* Expand a professional chat panel/modal.

Left Sidebar:

* Show all available users/groups
* Display:

  * Profile picture
  * Full name
  * Role
  * Online/offline status
  * Last message preview
  * Unread message count (WhatsApp-style)

Right Chat Window:

* Open selected chat
* Header should display:

  * Name/group name
  * Profile picture
  * Online status
  * Typing indicator

Chat Features:

* Real-time messaging
* Message delivery status
* Seen/read status
* Typing indicators
* Reply to message
* Mentions/tags
* Edit message
* File upload
* Media upload
* Document sharing
* Emoji support
* Group replies
* Individual chat replies
* Infinite scroll/pagination
* Search messages
* Pin important messages
* Timestamp display

---

## Group Features

Admin can:

* Create groups
* Add/remove members
* Assign group roles if needed
* Mention/tag users inside groups

---

## Security & Isolation

* Strict authorization required.
* Only authorized users can access their own chats/groups.
* No unauthorized message visibility.
* Validate all socket events.
* Protect against:

  * Unauthorized socket connections
  * Spam events
  * Data leakage

---

## Notifications

* Show unread message count beside each user/group.
* Show overall unread count on floating chat icon.
* Real-time notification updates.
* Optional browser notification support.

---

## Performance Requirements

* UI must be:

  * Modern
  * Smooth
  * Responsive
  * Production-ready
* Optimize for:

  * High traffic
  * Concurrent messaging
  * Minimal re-renders
  * Efficient socket rooms
  * Fast database queries

---

## Message Retention Policy

* All individual and group messages must automatically delete after 7 days.
* Use scheduled cleanup jobs/TTL strategy.

====================================================
2. TASK MANAGEMENT SYSTEM (Trello-style)
========================================

Build a modern task/project management system similar to Trello/Jira.

---

## Core Features

Admin can:

* Create workspaces/projects/rooms
* Create tasks
* Assign tasks to agents
* Track task progress
* Monitor productivity

---

## Kanban Board

Create a drag-and-drop Kanban board with columns such as:

* Todo
* In Progress
* Review
* Completed

Requirements:

* Smooth drag-and-drop interactions
* Real-time updates
* Optimized rendering

---

## Task Features

Each task should support:

* Title
* Description
* Priority level:

  * Low
  * Medium
  * High
  * Urgent
* Status
* Deadline
* Extend deadline
* Assigned members
* Comments/discussions
* File attachments
* Activity logs/history
* Labels/tags
* Subtasks/checklists
* Real-time updates

---

## Task Analytics & Productivity

Add features for:

* Task completion tracking
* Productivity analytics
* Deadline monitoring
* Overdue task indicators
* Task filtering/search
* Agent workload visibility

---

## Email Notification System

Implement automated email notifications.

Agent Deadline Reminder:

* Assigned agents must receive an automatic email reminder exactly 1 day before the deadline.

Reminder email should include:

* Task title
* Priority
* Deadline
* Workspace/project name
* Current status
* Admin/manager name
* Direct task link

Admin Completion Notification:

* When an agent marks a task as completed:

  * Automatically notify the admin by email.

Completion email should include:

* Task title
* Agent name
* Completion timestamp
* Project/workspace name
* Task summary
* Final status

---

## Notification Architecture

* Use background queue/job processing.
* Async email handling only.
* Retry failed emails automatically.
* Prevent duplicate notifications.
* Maintain notification logs/history.

Future-ready support for:

* Push notifications
* SMS
* Slack/Discord integration
* In-app notifications

====================================================
3. DATABASE ARCHITECTURE
========================

Use separate databases for scalability and modularity.

Chat Database:

* Environment Variable:
  MONDO_DB_URL_CHAT

Task Database:

* Environment Variable:
  MONDO_DB_URL_TASK

Existing Main Database:

* Continue using current database for:

  * Authentication
  * Users
  * Organizations
  * Relationship mapping
  * Roles & permissions

The chat/task modules should communicate with the main database through proper relationship mapping and authorization layers.

====================================================
4. SYSTEM DESIGN & ENGINEERING EXPECTATIONS
===========================================

Build this like a scalable SaaS product.

Requirements:

* Clean modular architecture
* Scalable backend structure
* Proper folder organization
* Role-based access control (RBAC)
* Secure socket authentication
* Optimized database queries
* Caching where required
* Proper validation
* Error handling
* Logging & monitoring
* Rate limiting
* Secure file upload handling
* Real-time synchronization
* Mobile responsive UI
* Future scalability support

====================================================
5. TECH STACK EXPECTATIONS
==========================

Backend:

* Node.js
* Express.js
* MongoDB
* Socket.IO
* Redis (recommended for scaling sockets/queues)
* BullMQ or similar queue system

Frontend:

* React.js
* Modern responsive UI
* Smooth animations/interactions
* Optimized rendering

Architecture Goals:

* Production-ready
* High performance
* Scalable
* Maintainable
* Secure
* Clean UI/UX
* Enterprise-grade experience
