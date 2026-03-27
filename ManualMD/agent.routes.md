# Agent API Routes (Agent Workspace)

This document outlines the routes used by agents for their daily tasks and profile management.

## Base URL: `/api/agent`

---

### 1. Update Own Profile
Updates the active agent's profile details.
- **Route:** `PATCH /profile`
- **Request Type:** Authenticated (Requires Agent Role)
- **Description:** Allows an agent to update their name, email, phone, and profile picture.

**Example Request Body:**
```json
{
  "user_name": "Smith Updated",
  "email": "smith_new@example.com",
  "phone_number": "9876543210"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "token": "...",
  "user": { ... }
}
```

---

### 2. Get Assigned Properties
Retrieves the list of properties assigned to the active agent.
- **Route:** `GET /properties`
- **Request Type:** Authenticated (Requires Agent Role)
- **Description:** Returns all properties where the agent is listed in the `assign_agent` field.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by title, type, address, city, or state
- `property_type` (optional): Filter by property type (e.g., Residential, Commercial)
- `listing_type` (optional): Filter by listing type (e.g., Sale, Rent)
- `property_status` (optional): Filter by status (e.g., Available, Sold)
- `is_active` (optional): Filter by active status

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d0fe4f5311236168a109bb",
      "property_title": "Luxury Villa",
      "property_type": "Residential",
      "listing_type": "Sale",
      "asking_price": 5000000,
      "currency": "INR",
      "property_status": "Available",
      "photos": [ ... ],
      "assign_agent": [ ... ]
    }
  ],
  "pagination": { ... }
}
```

---

### 3. Assign Another Agent to Property
Allows an agent to assign a colleague to a property they are already assigned to.
- **Route:** `POST /properties/:propertyId/assign-agent`
- **Request Type:** Authenticated (Requires Agent Role)
- **Description:** Adds another authorized agent to a property.

**Example Request Body:**
```json
{
  "agent_id": "60d0fe4f5311236168a109cc"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Agent assigned to property successfully",
  "data": { ... }
}
```
