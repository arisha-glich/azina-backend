# Timeslots Management API Documentation

## Overview

The Timeslots Management API provides endpoints for doctors (both linked to clinics and individual) to create, read, update, and delete appointment timeslots with pagination and filtering capabilities.

## Base URL

All timeslot endpoints are prefixed with `/api/v1/doctor/timeslots`

**Important:** The base URL is `/api/v1` and routes are mounted at `/doctor/timeslots`, resulting in the full path `/api/v1/doctor/timeslots`. Do NOT duplicate `/api/v1` in your requests.

**Correct URL Format:**
```
http://localhost:8080/api/v1/doctor/timeslots
```

**Incorrect URL Format (DO NOT USE):**
```
http://localhost:8080/api/v1/api/v1/doctor/timeslots  ❌
```

## Authentication

All endpoints require authentication. The authenticated user must be a doctor (either linked to a clinic or standalone).

## API Endpoints

### 1. Create Timeslot

Create a new timeslot for the authenticated doctor.

**Endpoint:** `POST /api/v1/doctor/timeslots`

**Request Body:**
```json
{
  "slot_date": "2024-12-01",
  "start_time": "09:00",
  "end_time": "10:00",
  "is_available": true,
  "consultation_type": "BOTH"
}
```

**Request Body Fields:**
- `slot_date` (required): Date in ISO format (YYYY-MM-DD)
- `start_time` (required): Start time in HH:mm format
- `end_time` (required): End time in HH:mm format
- `is_available` (optional): Whether the slot is available (default: `true`)
- `consultation_type` (optional): Consultation type - `BOTH` (default), `IN_PERSON`, or `VIDEO_CALL`

**Response (201 Created):**
```json
{
  "message": "Timeslot created successfully",
  "success": true,
  "data": {
    "id": "timeslot_id",
    "slot_date": "2024-12-01T00:00:00Z",
    "start_time": "09:00",
    "end_time": "10:00",
    "is_available": true,
    "consultation_type": "BOTH",
    "doctor_id": "doctor_id",
    "doctor": {
      "id": "doctor_id",
      "user": {
        "id": "user_id",
        "name": "Dr. John Doe",
        "email": "doctor@example.com"
      }
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Timeslot overlaps with an existing slot
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Doctor profile not found (see Troubleshooting section below)

### 2. Create Bulk Timeslots

Create multiple timeslots at once for the authenticated doctor.

**Endpoint:** `POST /api/v1/doctor/timeslots/bulk`

**Request Body:**
```json
{
  "timeslots": [
    {
      "slot_date": "2024-12-01",
      "start_time": "09:00",
      "end_time": "10:00",
      "is_available": true,
      "consultation_type": "IN_PERSON"
    },
    {
      "slot_date": "2024-12-01",
      "start_time": "10:00",
      "end_time": "11:00",
      "is_available": true,
      "consultation_type": "VIDEO_CALL"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Timeslots created",
  "success": true,
  "data": {
    "created": [
      {
        "id": "timeslot_id_1",
        "slot_date": "2024-12-01T00:00:00Z",
        "start_time": "09:00",
        "end_time": "10:00",
        "is_available": true
      }
    ],
    "errors": [
      {
        "payload": {
          "slot_date": "2024-12-01",
          "start_time": "10:00",
          "end_time": "11:00"
        },
        "error": "Timeslot overlaps with an existing slot"
      }
    ]
  }
}
```

### 3. Get Timeslots

Retrieve timeslots for the authenticated doctor with pagination and filtering options.

**Endpoint:** `GET /api/v1/doctor/timeslots`

**Important:** This endpoint automatically uses the authenticated user's ID to fetch timeslots. You do NOT need to pass a `doctorId` or `userId` parameter. The system automatically identifies the doctor profile associated with the authenticated user and returns their timeslots.

**Query Parameters:**
- `date` (optional): Filter by specific date (ISO format, e.g., "2024-12-01")
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `isAvailable` (optional): Filter by availability (`true` or `false`)
- `startTime` (optional): Filter by start time (HH:mm format, e.g., "09:00")
- `endTime` (optional): Filter by end time (HH:mm format, e.g., "17:00")
- `consultationType` (optional): Filter by consultation type (`BOTH`, `IN_PERSON`, or `VIDEO_CALL`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Note:** The API uses the authenticated user's ID (from the JWT token) to automatically filter timeslots. No need to pass `userId` or `doctorId` in the request.

**Response:**
```json
{
  "message": "Timeslots retrieved successfully",
  "success": true,
  "data": {
    "timeslots": [
      {
        "id": "timeslot_id",
        "slot_date": "2024-12-01T00:00:00Z",
        "start_time": "09:00",
        "end_time": "10:00",
        "is_available": true,
        "consultation_type": "BOTH",
        "doctor": {
          "id": "doctor_id",
          "user": {
            "name": "Dr. John Doe",
            "email": "doctor@example.com"
          }
        },
        "appointments": [
          {
            "id": "appointment_id",
            "status": "SCHEDULED",
            "appointment_date": "2024-12-01T00:00:00Z",
            "appointment_time": "09:00"
          }
        ],
        "_count": {
          "appointments": 1
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 4. Get Timeslot by ID

Retrieve a specific timeslot by ID for the authenticated doctor.

**Endpoint:** `GET /api/v1/doctor/timeslots/{timeslotId}`

**Path Parameters:**
- `timeslotId`: The ID of the timeslot

**Response:**
```json
{
  "message": "Timeslot retrieved successfully",
  "success": true,
  "data": {
    "id": "timeslot_id",
    "slot_date": "2024-12-01T00:00:00Z",
    "start_time": "09:00",
    "end_time": "10:00",
    "is_available": true,
    "consultation_type": "BOTH",
    "doctor": {
      "id": "doctor_id",
      "user": {
        "name": "Dr. John Doe",
        "email": "doctor@example.com"
      },
      "clinic": {
        "id": "clinic_id",
        "clinic_name": "Health Clinic",
        "address": {...}
      }
    },
    "appointments": [
      {
        "id": "appointment_id",
        "status": "SCHEDULED",
        "patient": {
          "user": {
            "name": "Patient Name",
            "email": "patient@example.com"
          }
        },
        "service": {
          "id": "service_id",
          "service_name": "Consultation"
        }
      }
    ]
  }
}
```

### 5. Update Timeslot

Update an existing timeslot for the authenticated doctor.

**Endpoint:** `PATCH /api/v1/doctor/timeslots/{timeslotId}`

**Path Parameters:**
- `timeslotId`: The ID of the timeslot to update

**Request Body:**
```json
{
  "slot_date": "2024-12-02",
  "start_time": "10:00",
  "end_time": "11:00",
  "is_available": false,
  "consultation_type": "IN_PERSON"
}
```

All fields are optional. Only include the fields you want to update.

**Response:**
```json
{
  "message": "Timeslot updated successfully",
  "success": true,
  "data": {
    "id": "timeslot_id",
    "slot_date": "2024-12-02T00:00:00Z",
    "start_time": "10:00",
    "end_time": "11:00",
    "is_available": false,
    "consultation_type": "IN_PERSON",
    "doctor": {...},
    "appointments": [...]
  }
}
```

**Error Responses:**
- **400 Bad Request**: Updated timeslot overlaps with an existing slot
- **404 Not Found**: Timeslot not found

### 6. Delete Timeslot

Delete a timeslot for the authenticated doctor. Cannot delete if the timeslot has active appointments.

**Endpoint:** `DELETE /api/v1/doctor/timeslots/{timeslotId}`

**Path Parameters:**
- `timeslotId`: The ID of the timeslot to delete

**Response:**
```json
{
  "message": "Timeslot deleted successfully",
  "success": true,
  "data": {
    "id": "timeslot_id",
    "slot_date": "2024-12-01T00:00:00Z",
    "start_time": "09:00",
    "end_time": "10:00",
    "is_available": true,
    "consultation_type": "BOTH"
  }
}
```

**Error Responses:**
- **400 Bad Request**: Cannot delete timeslot with active appointments
- **404 Not Found**: Timeslot not found

## Consultation Types

Timeslots support three consultation types:

- **BOTH** (default): The timeslot is available for both in-person and video call consultations
- **IN_PERSON**: The timeslot is only available for in-person consultations
- **VIDEO_CALL**: The timeslot is only available for video call consultations

When creating a timeslot, if `consultation_type` is not specified, it defaults to `BOTH`.

## Features

### Overlap Detection

When creating or updating timeslots, the system automatically checks for overlapping slots on the same date. An overlap occurs when:
- The new slot's start time falls within an existing slot's time range
- The new slot's end time falls within an existing slot's time range
- The new slot completely encompasses an existing slot

### Pagination

The `GET /api/v1/doctor/timeslots` endpoint supports pagination:
- Default page size: 20 items
- Use `page` parameter to navigate through pages
- Use `limit` parameter to change page size
- Response includes pagination metadata (total, totalPages, etc.)

### Filtering

Timeslots can be filtered by:
- **User ID**: Automatically filtered by the authenticated user's ID (no parameter needed)
- **Date Range**: Use `startDate` and `endDate` for range filtering
- **Specific Date**: Use `date` for a single day
- **Availability**: Use `isAvailable` to filter by availability status
- **Time Range**: Use `startTime` and `endTime` to filter by time of day
- **Consultation Type**: Use `consultationType` to filter by consultation type (`BOTH`, `IN_PERSON`, or `VIDEO_CALL`)

**Note:** The user ID filtering is automatic and based on the authenticated user. You cannot fetch timeslots for other users - the API will only return timeslots for the authenticated doctor.

### Support for Linked and Individual Doctors

All endpoints work for both:
- **Linked Doctors**: Doctors associated with a clinic
- **Individual Doctors**: Standalone doctors not linked to any clinic

The system automatically identifies the doctor type based on the authenticated user's profile.

## Error Responses

All endpoints may return the following error responses:

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**:
  - Doctor profile not found: The authenticated user doesn't have a doctor profile (most common issue)
  - Timeslot not found: The specified timeslot ID doesn't exist or doesn't belong to the doctor
- **400 Bad Request**: Invalid request data or business rule violation (overlaps, active appointments)
- **500 Internal Server Error**: Server error

Error response format:
```json
{
  "message": "Error message",
  "success": false
}
```

## Frontend Integration Guide

### How User ID Filtering Works

The `GET /api/v1/doctor/timeslots` endpoint uses **automatic user-based filtering**. Here's how it works:

1. **Authentication**: The frontend sends a request with a JWT token in the `Authorization` header
2. **User Extraction**: The backend extracts the user ID from the JWT token
3. **Doctor Lookup**: The backend finds the doctor profile associated with that user ID
4. **Timeslot Filtering**: Only timeslots belonging to that doctor are returned

**Key Points:**
- ✅ No need to pass `userId` or `doctorId` in query parameters
- ✅ The filtering is automatic based on the authenticated user
- ✅ Each doctor only sees their own timeslots
- ✅ Works for both linked doctors (clinic) and individual doctors

### Integration Example

```javascript
// React/Next.js Example
async function fetchMyTimeslots(date, page = 1, limit = 20) {
  const token = localStorage.getItem('authToken'); // Your auth token storage

  const params = new URLSearchParams({
    date: date, // e.g., "2024-12-01"
    page: page.toString(),
    limit: limit.toString(),
    // Note: NO userId or doctorId needed!
  });

  // IMPORTANT: API_BASE_URL should be just the base (e.g., "http://localhost:8080")
  // The /api/v1 prefix is already included in the route, so don't add it again!
  const response = await fetch(
    `${API_BASE_URL}/api/v1/doctor/timeslots?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data; // Contains timeslots and pagination
  } else {
    throw new Error(data.message);
  }
}

// Usage
const timeslots = await fetchMyTimeslots('2024-12-01', 1, 20);
console.log(timeslots.timeslots); // Array of timeslots
console.log(timeslots.pagination); // Pagination info
```

### TypeScript Types (for reference)

```typescript
interface TimeslotResponse {
  message: string;
  success: boolean;
  data: {
    timeslots: Timeslot[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface Timeslot {
  id: string;
  slot_date: string; // ISO date string
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_available: boolean;
  consultation_type: 'BOTH' | 'IN_PERSON' | 'VIDEO_CALL';
  doctor: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  appointments: Array<{
    id: string;
    status: string;
    appointment_date: string;
    appointment_time: string;
  }>;
  _count: {
    appointments: number;
  };
}
```

## Example Usage

### Creating a Weekly Schedule

```bash
# Create timeslots for Monday
POST /api/v1/doctor/timeslots/bulk
{
  "timeslots": [
    {"slot_date": "2024-12-02", "start_time": "09:00", "end_time": "10:00", "consultation_type": "BOTH"},
    {"slot_date": "2024-12-02", "start_time": "10:00", "end_time": "11:00", "consultation_type": "IN_PERSON"},
    {"slot_date": "2024-12-02", "start_time": "14:00", "end_time": "15:00", "consultation_type": "VIDEO_CALL"}
  ]
}
```

### Filtering by Consultation Type

```bash
# Get only in-person timeslots
GET /api/v1/doctor/timeslots?consultationType=IN_PERSON

# Get only video call timeslots
GET /api/v1/doctor/timeslots?consultationType=VIDEO_CALL

# Get timeslots available for both
GET /api/v1/doctor/timeslots?consultationType=BOTH
```

### Viewing Available Slots for a Date

```bash
# Get available timeslots for the authenticated doctor on a specific date
GET /api/v1/doctor/timeslots?date=2024-12-02&isAvailable=true

# Get all timeslots for the authenticated doctor in a date range
GET /api/v1/doctor/timeslots?startDate=2024-12-01&endDate=2024-12-31&page=1&limit=50
```

**Note:** All timeslots returned are automatically filtered to belong to the authenticated doctor. No need to specify `userId` or `doctorId`.

### Updating Slot Availability and Type

```bash
# Update availability
PATCH /api/v1/doctor/timeslots/{timeslotId}
{
  "is_available": false
}

# Update consultation type
PATCH /api/v1/doctor/timeslots/{timeslotId}
{
  "consultation_type": "VIDEO_CALL"
}
```

## Troubleshooting

### Common Issues

#### 1. 404 Not Found - "Doctor not found"

**Error Response:**
```json
{
  "message": "Doctor not found",
  "success": false
}
```

**Cause:** The authenticated user does not have a doctor profile associated with their account.

**Solution:**
- Ensure the authenticated user has completed doctor profile setup
- Verify the user has a doctor record in the system
- Check that the user's role includes doctor permissions
- The user may need to complete the doctor onboarding process first

**How to Verify:**
1. Check if the user has a doctor profile by calling `GET /api/v1/doctor/me`
2. If that endpoint also returns 404, the user needs to create/complete their doctor profile
3. Ensure the authentication token is valid and belongs to a user with doctor role

#### 2. 401 Unauthorized

**Error Response:**
```json
{
  "message": "Unauthorized",
  "success": false
}
```

**Cause:** Missing or invalid authentication token.

**Solution:**
- Ensure the request includes a valid authentication token in the Authorization header
- Verify the token hasn't expired
- Check that the token format is correct (usually `Bearer <token>`)

#### 3. Route Not Found (404) or Duplicate `/api/v1` in URL

**Error Response:**
```
404 GET http://localhost:8080/api/v1/doctor/timeslots
// OR
404 GET http://localhost:8080/api/v1/api/v1/doctor/timeslots  ❌ WRONG!
```

**Cause:**
- The endpoint path is incorrect
- Duplicate `/api/v1` in the URL (common mistake)
- Server hasn't been restarted after route changes

**Solution:**
- ✅ **Correct URL:** `http://localhost:8080/api/v1/doctor/timeslots`
- ❌ **Wrong URL:** `http://localhost:8080/api/v1/api/v1/doctor/timeslots`
- Ensure your `API_BASE_URL` is just the base (e.g., `http://localhost:8080`) without `/api/v1`
- The `/api/v1` prefix is automatically included in the route registration
- Ensure the backend server has been restarted after any route configuration changes
- Verify the HTTP method matches (GET for retrieving timeslots)

**Correct Endpoint Format:**
```javascript
// ✅ CORRECT
const API_BASE_URL = 'http://localhost:8080'  // No /api/v1 here!
fetch(`${API_BASE_URL}/api/v1/doctor/timeslots`)

// ❌ WRONG - Don't add /api/v1 to base URL
const API_BASE_URL = 'http://localhost:8080/api/v1'  // Wrong!
fetch(`${API_BASE_URL}/api/v1/doctor/timeslots`)  // Results in duplicate!
```

#### 4. Query Parameter Issues

**Common Mistakes:**
- Using `start_date` instead of `startDate` (camelCase required)
- Using `end_date` instead of `endDate` (camelCase required)
- Using `is_available` instead of `isAvailable` (camelCase required)
- Using `consultation_type` instead of `consultationType` (camelCase required)

**Correct Query Parameters:**
- `startDate` (not `start_date`)
- `endDate` (not `end_date`)
- `isAvailable` (not `is_available`)
- `consultationType` (not `consultation_type`)
- `startTime` (not `start_time`)
- `endTime` (not `end_time`)

### Verification Steps

1. **Check Authentication:**
   ```bash
   GET /api/v1/doctor/me
   ```
   If this returns 404, the user doesn't have a doctor profile.

2. **Check Endpoint Availability:**
   ```bash
   GET /api/v1/doctor/timeslots
   ```
   Should return either:
   - 200 OK with timeslots data (if doctor profile exists)
   - 404 with "Doctor not found" (if doctor profile doesn't exist)
   - 401 Unauthorized (if authentication is missing/invalid)

3. **Verify Request Format:**
   - URL: `http://localhost:8080/api/v1/doctor/timeslots`
   - Method: `GET`
   - Headers: `Authorization: Bearer <token>`
   - Query params: Use camelCase (e.g., `startDate`, not `start_date`)

### Important Notes for Frontend Developers

1. **Automatic User ID Filtering:** The `GET /api/v1/doctor/timeslots` endpoint automatically uses the authenticated user's ID to fetch timeslots. You do NOT need to pass `userId` or `doctorId` as a parameter. The system automatically:
   - Extracts the user ID from the JWT authentication token
   - Finds the associated doctor profile
   - Returns only timeslots belonging to that doctor

   **Example:**
   ```javascript
   // ✅ Correct - No userId/doctorId needed
   GET /api/v1/doctor/timeslots?date=2024-12-01&page=1&limit=20

   // ❌ Incorrect - Don't pass userId or doctorId
   GET /api/v1/doctor/timeslots?userId=xxx&date=2024-12-01
   ```

2. **Doctor Profile Requirement:** Before calling timeslot endpoints, ensure the user has a doctor profile. Use `GET /api/v1/doctor/me` to verify.

3. **Error Handling:** Always check the `success` field in the response. Even with a 200 status, the API may return `success: false` with an error message.

4. **Query Parameters:** All query parameters use camelCase, not snake_case. This is important for filtering and pagination.

5. **Date Format:** Use ISO date format (YYYY-MM-DD) for all date-related parameters.

6. **Server Restart:** If you're experiencing routing issues, ensure the backend server has been restarted after any recent changes.

7. **Authentication Token:** The user ID is automatically extracted from the JWT token in the `Authorization` header. Make sure your requests include a valid Bearer token.

