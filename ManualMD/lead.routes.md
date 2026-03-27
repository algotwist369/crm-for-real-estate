# Lead API Routes (CRM Management)

This document provides a detailed guide to managing leads and follow-ups.

## Base URL: `/api/leads`

---

### 1. Get My Leads
Fetches leads assigned to the current user or all leads (for Admins).
- **Route:** `GET /leads`
- **Request Type:** Authenticated (Requires Admin or Agent Role)
- **Description:** Returns a paginated list of leads with search and filter capabilities.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `status` (optional): Filter by lead status (`new`, `follow_up`, `converted`, `lost`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)
- `follow_up_due` (optional): Filter leads with follow-ups due (`today`, `overdue`, `upcoming`, `true`/`1`)
- `search` (optional): Search by name, email, phone, requirement, budget, or notes
- `assigned_to` (optional, Admin only): Filter by agent ID

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d0fe4f5311236168a109cc",
      "name": "David Dev",
      "email": "david@example.com",
      "phone": "9876543210",
      "requirement": "3 BHK Flat in City Center",
      "budget": "1.2 Cr",
      "status": "new",
      "priority": "high",
      "next_follow_up_date": "2024-03-30T10:00:00.000Z",
      "follow_up_status": "pending",
      "assigned_to": [ ... ]
    }
  ],
  "pagination": { ... }
}
```

---

### 2. Get Lead by ID
Retrieves details of a specific lead.
- **Route:** `GET /leads/:id`
- **Request Type:** Authenticated
- **Description:** Returns full details, notes, and history of a lead. Agents can only access leads assigned to them.

**Example Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### 3. Create a New Lead
Registers a new lead in the CRM system.
- **Route:** `POST /leads`
- **Request Type:** Authenticated
- **Description:** Creates a lead and optionally assigns it to agents.

**Example Request Body:**
```json
{
  "name": "David Dev",
  "email": "david@example.com",
  "phone": "9876543210",
  "requirement": "3 BHK Flat in City Center",
  "budget": "1.2 Cr",
  "inquiry_for": "Property Purchase",
  "assigned_to": ["60d0fe4f5311236168a109cc"],
  "next_follow_up_date": "2024-03-30T10:00:00.000Z",
  "priority": "medium",
  "status": "new"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": { ... }
}
```

---

### 4. Update Lead Details
Updates lead information, status, or priority.
- **Route:** `PATCH /leads/:id`
- **Request Type:** Authenticated
- **Description:** Allows updating fields like name, budget, requirement, or notes. Agents have restricted update access for some fields.

**Example Request Body:**
```json
{
  "status": "follow_up",
  "budget": "1.5 Cr",
  "notes": "Interested in premium segment."
}
```

---

### 5. Add Private Note to Lead
Appends a private note or comment to a lead.
- **Route:** `POST /leads/:id/notes`
- **Request Type:** Authenticated
- **Description:** Quickly add a timestamped note to the lead's history.

**Example Request Body:**
```json
{
  "note": "Spoke to the client, he asked to call back next week."
}
```

---

### 6. Set/Update Follow-up Reminder
Schedules or updates the next follow-up for a lead.
- **Route:** `POST /leads/:id/followup`
- **Request Type:** Authenticated
- **Description:** Updates the `next_follow_up_date` and `follow_up_status`. Triggers automated reminders.

**Example Request Body:**
```json
{
  "next_follow_up_date": "2024-04-05T14:30:00.000Z",
  "follow_up_status": "pending",
  "remarks": "Final negotiation call."
}
```

---

### 7. Mark Follow-up as Complete
Sets the current follow-up status to 'done'.
- **Route:** `POST /leads/:id/followup/complete`
- **Request Type:** Authenticated
- **Description:** Sets `follow_up_status` to `done` and captures the timestamp.

**Example Request Body:**
```json
{
  "remarks": "Call answered, ready to visit the property."
}
```

---

### 8. Mark Lead as Converted
Converts the lead to a closed deal.
- **Route:** `POST /leads/:id/convert`
- **Request Type:** Authenticated
- **Description:** Updates `status` to `converted` and captures the conversion timestamp.

**Example Response:**
```json
{
  "success": true,
  "message": "Lead marked as converted",
  "data": { ... }
}
```

---

### 9. Mark Lead as Lost
Closes the lead as lost.
- **Route:** `POST /leads/:id/lost`
- **Request Type:** Authenticated
- **Description:** Updates `status` to `lost` and records the reason.

**Example Request Body:**
```json
{
  "lost_reason": "Purchased from another competitor."
}
```

---

### 10. Get Follow-up List
Retrieves a list of follow-up tasks.
- **Route:** `GET /followups`
- **Request Type:** Authenticated
- **Description:** Returns a list of leads with pending or overdue follow-up dates.

**Query Parameters:**
- `bucket` (optional): Follow-up type (`today`, `overdue`, or `upcoming`, default: `today`)

---

### 11. Agent Dashboard Summary
Returns a bird's-eye view of an agent's leads and performance.
- **Route:** `GET /dashboard/agent-summary`
- **Request Type:** Authenticated
- **Description:** Metrics including total leads, converted count, lost count, and follow-up counts.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total_leads": 120,
    "total_converted_leads": 15,
    "total_lost_leads": 10,
    "followups_today": 5,
    "followups_overdue": 2
  }
}
```

---

### 12. Lead Activity Timeline
Retrieves a timeline of recent changes across all leads.
- **Route:** `GET /dashboard/activity`
- **Request Type:** Authenticated
- **Description:** Returns the most recently updated leads for activity tracking.

**Query Parameters:**
- `limit` (optional): Number of recent activities to return (default: 20)
