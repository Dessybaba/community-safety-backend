# Community Safety Backend API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### Get Profile
**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Incident Endpoints

### Get Verified Incidents (Public)
**GET** `/incidents/verified`

**Query Parameters:**
- `type` (optional): Filter by incident type (road_hazard, theft, flooding, power_outage, fire, other)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:** `/incidents/verified?type=fire&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "incidents": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### Create Incident Report
**POST** `/incidents`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "fire",
  "description": "Fire outbreak at the market",
  "location": [7.4951, 9.0579],
  "address": "Wuse Market, Abuja",
  "images": ["https://example.com/image1.jpg"]
}
```

**Location Format:** `[longitude, latitude]`

**Incident Types:**
- `road_hazard`
- `theft`
- `flooding`
- `power_outage`
- `fire`
- `other`

**Response:**
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "incident": {...}
  }
}
```

### Get My Incidents
**GET** `/incidents/my-incidents`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (reported, verified, rejected, resolved)
- `type` (optional): Filter by type
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "incidents": [...],
    "pagination": {...}
  }
}
```

### Get Incident by ID
**GET** `/incidents/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "incident": {...}
  }
}
```

### Update My Incident
**PUT** `/incidents/:id`

**Headers:** `Authorization: Bearer <token>`

**Note:** Can only update incidents with status "reported" (before verification)

**Request Body:**
```json
{
  "type": "fire",
  "description": "Updated description",
  "location": [7.4951, 9.0579],
  "address": "Updated address",
  "images": ["https://example.com/image2.jpg"]
}
```

### Delete My Incident
**DELETE** `/incidents/:id`

**Headers:** `Authorization: Bearer <token>`

**Note:** Can only delete incidents with status "reported" (before verification)

---

## Moderator/Admin Endpoints

### Get All Incidents (Moderator/Admin)
**GET** `/incidents`

**Headers:** `Authorization: Bearer <token>` (Moderator/Admin only)

**Query Parameters:**
- `status` (optional): Filter by status
- `type` (optional): Filter by type
- `page` (optional): Page number
- `limit` (optional): Items per page

### Verify Incident
**PATCH** `/incidents/:id/verify`

**Headers:** `Authorization: Bearer <token>` (Moderator/Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Incident verified successfully",
  "data": {
    "incident": {...}
  }
}
```

### Reject Incident
**PATCH** `/incidents/:id/reject`

**Headers:** `Authorization: Bearer <token>` (Moderator/Admin only)

**Request Body:**
```json
{
  "rejectionReason": "False report or inappropriate content"
}
```

### Resolve Incident
**PATCH** `/incidents/:id/resolve`

**Headers:** `Authorization: Bearer <token>` (Moderator/Admin only)

**Note:** Can only resolve incidents with status "verified"

---

## Incident Status Lifecycle

1. **reported** - Initial status when user creates an incident
2. **verified** - Moderator/Admin verifies the incident
3. **rejected** - Moderator/Admin rejects the incident
4. **resolved** - Moderator/Admin marks verified incident as resolved

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (development only)"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/community-safety-backend
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

---

## Health Check

**GET** `/api/health`

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

