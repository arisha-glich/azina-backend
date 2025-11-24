# Patient Booking Flow API Documentation

## Overview

The Patient Booking Flow API provides endpoints for patients to browse services, select doctors, view timeslots, and manage their cart for both consultation and product-based services.

## Base URL

All booking endpoints are prefixed with `/api/v1/patient/booking`

## Authentication

All endpoints require authentication. Include the authentication token in the request headers.

## API Endpoints

### 1. Get Services for Booking

Retrieve all services with their conditions, filtered by location and product/consultation type.

**Endpoint:** `GET /api/v1/patient/booking/services`

**Query Parameters:**
- `city` (optional): Filter by city (e.g., "London")
- `state` (optional): Filter by state (e.g., "Greater London")
- `country` (optional): Filter by country (e.g., "United Kingdom")
- `offerAsProduct` (optional): Filter by product (`true`) or consultation (`false`)
- `clinicId` (optional): Filter by clinic ID
- `doctorId` (optional): Filter by doctor ID

**Response:**
```json
{
  "message": "Services retrieved successfully",
  "success": true,
  "data": {
    "services": [
      {
        "id": "service_id",
        "service_name": "Consultation",
        "description": "General consultation",
        "conditions": [
          {
            "id": "condition_id",
            "name": "General Checkup",
            "price": 50.00,
            "offer_as_product": false
          }
        ],
        "clinic": {
          "id": "clinic_id",
          "clinic_name": "Health Clinic",
          "address": {
            "city": "London",
            "state": "Greater London",
            "country": "United Kingdom"
          }
        },
        "doctor": {
          "id": "doctor_id",
          "specialization": "Cardiology",
          "user": {
            "name": "Dr. John Doe",
            "email": "doctor@example.com"
          }
        }
      }
    ]
  }
}
```

### 2. Get Doctors by Service

Retrieve all doctors who offer a specific service (for consultation flow).

**Endpoint:** `GET /api/v1/patient/booking/services/{serviceId}/doctors`

**Path Parameters:**
- `serviceId`: The ID of the service

**Query Parameters:**
- `city` (optional): Filter by city
- `state` (optional): Filter by state
- `country` (optional): Filter by country

**Response:**
```json
{
  "message": "Doctors retrieved successfully",
  "success": true,
  "data": {
    "service": {
      "id": "service_id",
      "service_name": "Consultation",
      "conditions": [...]
    },
    "doctors": [
      {
        "id": "doctor_id",
        "specialization": "Cardiology",
        "consultation_fee": 100.00,
        "bio": "Experienced cardiologist",
        "averageRating": 4.5,
        "totalReviews": 20,
        "user": {
          "name": "Dr. John Doe",
          "email": "doctor@example.com",
          "image": "profile_image_url"
        },
        "clinic": {
          "id": "clinic_id",
          "clinic_name": "Health Clinic",
          "address": {...}
        },
        "services": [...]
      }
    ]
  }
}
```

### 3. Get Doctor Details with Timeslots

Retrieve doctor details including services, reviews, and available timeslots.

**Endpoint:** `GET /api/v1/patient/booking/doctors/{doctorId}`

**Path Parameters:**
- `doctorId`: The ID of the doctor

**Query Parameters:**
- `date` (optional): Filter timeslots by date (ISO format, e.g., "2024-12-01")
- `isAvailable` (optional): Filter by availability (`true` or `false`)
- `consultationType` (optional): Filter by consultation type (`BOTH`, `IN_PERSON`, or `VIDEO_CALL`)
- `consultationType` (optional): Filter by consultation type (`BOTH`, `IN_PERSON`, or `VIDEO_CALL`)

**Response:**
```json
{
  "message": "Doctor details retrieved successfully",
  "success": true,
  "data": {
    "id": "doctor_id",
    "specialization": "Cardiology",
    "consultation_fee": 100.00,
    "bio": "Experienced cardiologist",
    "experience_years": 10,
    "averageRating": 4.5,
    "totalReviews": 20,
    "user": {
      "name": "Dr. John Doe",
      "email": "doctor@example.com",
      "image": "profile_image_url",
      "phone_no": "+1234567890"
    },
    "clinic": {
      "id": "clinic_id",
      "clinic_name": "Health Clinic",
      "address": {...},
      "user": {...}
    },
    "services": [...],
    "reviews": [
      {
        "id": "review_id",
        "rating": 5,
        "review_text": "Great doctor!",
        "createdAt": "2024-01-01T00:00:00Z",
        "patient": {
          "user": {
            "name": "Patient Name",
            "image": "patient_image_url"
          }
        }
      }
    ],
            "appointment_slots": [
      {
        "id": "slot_id",
        "slot_date": "2024-12-01T00:00:00Z",
        "start_time": "09:00",
        "end_time": "10:00",
        "is_available": true,
        "consultation_type": "BOTH"
      }
    ]
  }
}
```

### 4. Add to Cart

Add a service (product) to the patient cart.

**Endpoint:** `POST /api/v1/patient/booking/cart`

**Request Body:**
```json
{
  "serviceId": "service_id",
  "quantity": 1
}
```

**Response:**
```json
{
  "message": "Item added to cart successfully",
  "success": true,
  "data": {
    "id": "cart_item_id",
    "quantity": 1,
    "service": {
      "id": "service_id",
      "service_name": "Product Service",
      "conditions": [
        {
          "id": "condition_id",
          "name": "Product Name",
          "price": 25.00,
          "offer_as_product": true
        }
      ]
    }
  }
}
```

### 5. Get Cart

Retrieve all items in the patient cart.

**Endpoint:** `GET /api/v1/patient/booking/cart`

**Response:**
```json
{
  "message": "Cart retrieved successfully",
  "success": true,
  "data": {
    "cartItems": [
      {
        "id": "cart_item_id",
        "quantity": 2,
        "service": {
          "id": "service_id",
          "service_name": "Product Service",
          "conditions": [...],
          "clinic": {...},
          "doctor": {...}
        }
      }
    ]
  }
}
```

### 6. Remove from Cart

Remove an item from the patient cart.

**Endpoint:** `DELETE /api/v1/patient/booking/cart/{cartItemId}`

**Path Parameters:**
- `cartItemId`: The ID of the cart item to remove

**Response:**
```json
{
  "message": "Item removed from cart successfully",
  "success": true,
  "data": {
    "id": "cart_item_id",
    "quantity": 1,
    "service_id": "service_id"
  }
}
```

### 7. Update Cart Quantity

Update the quantity of an item in the patient cart.

**Endpoint:** `PATCH /api/v1/patient/booking/cart/{cartItemId}`

**Path Parameters:**
- `cartItemId`: The ID of the cart item

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "message": "Cart item quantity updated successfully",
  "success": true,
  "data": {
    "id": "cart_item_id",
    "quantity": 3,
    "service": {...}
  }
}
```

## Booking Flow

### Consultation Flow

1. **Get Services**: Call `GET /api/v1/patient/booking/services?offerAsProduct=false` to get consultation services
2. **Select Service**: Choose a service from the list
3. **Get Doctors**: Call `GET /api/v1/patient/booking/services/{serviceId}/doctors` to see available doctors
4. **View Doctor Details**: Call `GET /api/v1/patient/booking/doctors/{doctorId}` to see doctor details and timeslots
5. **Book Appointment**: Select a timeslot and proceed with appointment booking

### Product Flow

1. **Get Services**: Call `GET /api/v1/patient/booking/services?offerAsProduct=true` to get product services
2. **Add to Cart**: Call `POST /api/v1/patient/booking/cart` to add products to cart
3. **View Cart**: Call `GET /api/v1/patient/booking/cart` to see cart items
4. **Update Quantity**: Call `PATCH /api/v1/patient/booking/cart/{cartItemId}` to update quantities
5. **Remove Items**: Call `DELETE /api/v1/patient/booking/cart/{cartItemId}` to remove items
6. **Checkout**: Proceed with order creation

## Error Responses

All endpoints may return the following error responses:

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource not found
- **400 Bad Request**: Invalid request data
- **500 Internal Server Error**: Server error

Error response format:
```json
{
  "message": "Error message",
  "success": false
}
```

