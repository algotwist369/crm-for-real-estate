# Admin API Routes (Agent Management)

This document describes the admin-specific routes for managing agents and their assignments.

## Base URL: `/api/admin`

---

### 1. Get All Agents
Fetches a list of all registered agents with pagination and search.
- **Route:** `GET /agents`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Returns all agents associated with the current tenant.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of records per page (default: 10, max: 100)
- `search` (optional): Search by name, email, or phone number
- `status` (optional): Filter by agent status (`active` or `inactive`)

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d0fe4f5311236168a109ca",
      "agent_details": {
        "user_name": "Agent Smith",
        "email": "smith@example.com",
        "phone_number": "9876543210",
        "profile_pic": "...",
        "role": "agent",
        "is_active": true
      },
      "agent_role": "Manager",
      "agent_pin": 1234,
      "is_active": true,
      "assigned_properties": [ ... ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### 2. Get Agent by ID
Retrieves details of a specific agent.
- **Route:** `GET /agents/:id`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Returns the details, profile, and assigned properties for a specific agent.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "agent_details": { ... },
    "agent_role": "Sales Head",
    "assigned_properties": [ ... ]
  }
}
```

---

### 3. Create a New Agent
Registers a new agent into the system.
- **Route:** `POST /agents`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Creates an agent profile and associated user credentials.

**Example Request Body:**
```json
{
  "user_name": "Alice Agent",
  "email": "alice@example.com",
  "phone_number": "1234567890",
  "agent_role": "Residential Specialist",
  "agent_pin": "1234"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Agent created successfully",
  "data": { ... },
  "credentials": {
    "phone_number": "1234567890",
    "email": "alice@example.com",
    "password": "Ag1234567890"  // Generated based on PIN and Phone
  }
}
```

---

### 4. Update an Agent
Updates an existing agent's details.
- **Route:** `PATCH /agents/:id`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Allows updating name, role, email, phone, and PIN of an agent.

**Example Request Body:**
```json
{
  "user_name": "Alice Updated",
  "agent_role": "Sales Manager"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Agent updated successfully",
  "data": { ... }
}
```

---

### 5. Update Agent Status
Toggles an agent's account status (enabled/disabled).
- **Route:** `PATCH /agents/:id/status`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Actives or deactivates an agent. If deactivated, the agent cannot log in.

**Example Request Body:**
```json
{
  "is_active": false
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Agent status updated successfully",
  "data": { ... }
}
```

---

### 6. Assign Project to Agent
Links a specific project to an agent.
- **Route:** `POST /agents/:id/assign-project`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Adds a project to the agent's assigned projects list.

**Example Request Body:**
```json
{
  "project_id": "60d0fe4f5311236168a109bb"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Project assigned successfully",
  "data": { ... }
}
```

---

### 7. Add Remark to Agent
Adds a private admin comment or remark about an agent.
- **Route:** `POST /agents/:id/remark`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Updates the `remark` field for an agent.

**Example Request Body:**
```json
{
  "remark": "Promising performance this month."
}
```

---

### 8. Delete Agent
Permanently removes an agent and their associated user account.
- **Route:** `DELETE /agents/:id`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Deletes both the Agent and User documents from the database.

**Example Response:**
```json
{
  "success": true,
  "message": "Agent and associated user deleted permanently"
}
```
