# Authentication API Routes

This document provides a detailed explanation of the authentication and user-related routes.

## Base URL: `/api/auth`

---

### 1. Admin Registration
Registers a new administrator user.
- **Route:** `POST /admin/register`
- **Request Type:** Public (No authentication required)
- **Description:** Creates a new user with the `admin` role and returns an auth token.

**Example Request Body:**
```json
{
  "user_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "1234567890",
  "password": "Password@123",
  "remember": true
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "user": {
    "_id": "60d0fe4f5311236168a109ca",
    "user_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "1234567890",
    "role": "admin",
    "is_active": true
  }
}
```

---

### 2. User Login
Unified login for all user roles (Admin, Super Admin, Agent).
- **Route:** `POST /login`
- **Request Type:** Public
- **Description:** Authenticates a user using either email or phone number and returns an auth token.

**Example Request Body:**
```json
{
  "phone_or_email": "john@example.com",
  "password": "Password@123",
  "remember": true
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "60d0fe4f5311236168a109ca",
    "user_name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

---

### 3. Get Current User
Retrieves information about the currently logged-in user.
- **Route:** `GET /me`
- **Request Type:** Authenticated (Requires Bearer Token)
- **Description:** Returns the profile of the user associated with the provided auth token.

**Example Response:**
```json
{
  "success": true,
  "user": {
    "_id": "60d0fe4f5311236168a109ca",
    "user_name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "is_active": true
  }
}
```

---

### 4. Logout User
Invalidates the current authentication token.
- **Route:** `POST /logout`
- **Request Type:** Authenticated
- **Description:** Adds the current token to the blacklist and clears the token cookie.

**Example Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5. Change Password
Allows a logged-in user to update their password.
- **Route:** `POST /change-password`
- **Request Type:** Authenticated
- **Description:** Updates the password after verifying the current password.

**Example Request Body:**
```json
{
  "current_password": "OldPassword@123",
  "new_password": "NewPassword@123"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "user": { ... }
}
```

---

### 6. Update Admin Profile
Updates the profile information of an admin.
- **Route:** `PATCH /admin/profile`
- **Request Type:** Authenticated (Requires Admin Role)
- **Description:** Updates name, email, phone, or profile picture for an administrator.

**Example Request Body:**
```json
{
  "user_name": "John Updated",
  "email": "john_new@example.com"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```
