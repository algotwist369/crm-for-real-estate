# Property API Routes (Inventory Management)

This document explains the API routes for managing real estate properties and their assignments.

## Base URL: `/api/properties`

---

### 1. Get All Properties
Fetches a list of properties with pagination and advanced filtering.
- **Route:** `GET /properties`
- **Request Type:** Authenticated (Requires Admin or Agent Role)
- **Description:** Returns all properties in the inventory based on specified filters. Agents can only see properties assigned to them.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `search` (optional): Search by title, type, address, city, state, or country
- `property_type` (optional): (e.g., Apartment, Villa, Office)
- `listing_type` (optional): (e.g., Sale, Rent, PG)
- `property_status` (optional): (e.g., Available, Under Offer, Sold, Rented)
- `is_active` (optional): (e.g., true, false)
- `min_price` (optional): Filter by minimum asking price
- `max_price` (optional): Filter by maximum asking price
- `agent_id` (optional, Admin only): Filter by assigned agent's ID

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

### 2. Get Property by ID
Retrieves full details of a specific property.
- **Route:** `GET /properties/:id`
- **Request Type:** Authenticated
- **Description:** Returns details including price, location, dimensions, description, photos, and documents.

**Example Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### 3. Create a New Property
Adds a new property to the inventory.
- **Route:** `POST /properties`
- **Request Type:** Authenticated
- **Description:** Creates a new property with associated media, files, and assigned agents. Supports file uploads or base64/url-based media.

**Example Request Body:**
```json
{
  "property_title": "Luxury Villa",
  "property_type": "Residential",
  "listing_type": "Sale",
  "asking_price": 5000000,
  "currency": "INR",
  "property_location": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001"
  },
  "assign_agent": ["60d0fe4f5311236168a109cc"],
  "property_status": "Available",
  "total_area": 2500,
  "area_unit": "sq ft"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": { ... }
}
```

---

### 4. Update Property Details
Updates information for an existing property.
- **Route:** `PATCH /properties/:id`
- **Request Type:** Authenticated
- **Description:** Updates various property fields, photos, or documents. Agents can only update properties they are assigned to.

**Example Request Body:**
```json
{
  "property_title": "Villa - Phase 2",
  "asking_price": 5200000,
  "is_active": true
}
```

---

### 5. Update Property Status
Toggles property status or availability.
- **Route:** `PATCH /properties/:id/status`
- **Request Type:** Authenticated
- **Description:** Quickly updates the `property_status` field (e.g., Sold) or `is_active` status.

**Example Request Body:**
```json
{
  "status": "sold"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Property status updated successfully",
  "data": { ... }
}
```

---

### 6. Delete (Deactivate) Property
Removes a property from active inventory.
- **Route:** `DELETE /properties/:id`
- **Request Type:** Authenticated
- **Description:** Sets property status to `inactive` and `is_active` to `false`. Removes agent-property assignments. Does not permanently delete the record.

**Example Response:**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```
