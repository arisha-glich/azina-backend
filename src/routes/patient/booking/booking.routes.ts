import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { ServiceSchema, ServiceConditionSchema, Appointment_SlotSchema, CartSchema } from '~/zod/models'

export const BOOKING_ROUTES = {
  get_services_for_booking: createRoute({
    method: 'get',
    tags: [API_TAGS.PATIENT],
    path: '/booking/services',
    summary: 'Get all services with conditions for booking',
    description: 'Retrieve all services with their conditions, filtered by location and product/consultation type',
    request: {
      query: z.object({
        city: z.string().optional().openapi({ description: 'Filter by city', example: 'London' }),
        state: z.string().optional().openapi({ description: 'Filter by state', example: 'Greater London' }),
        country: z.string().optional().openapi({ description: 'Filter by country', example: 'United Kingdom' }),
        offerAsProduct: z
          .string()
          .optional()
          .transform(val => val === 'true')
          .openapi({ description: 'Filter by product (true) or consultation (false)', example: 'false' }),
        clinicId: z.string().optional().openapi({ description: 'Filter by clinic ID' }),
        doctorId: z.string().optional().openapi({ description: 'Filter by doctor ID' }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            services: z.array(
              ServiceSchema.extend({
                conditions: z.array(ServiceConditionSchema),
                clinic: z
                  .object({
                    id: z.string(),
                    clinic_name: z.string(),
                    address: z
                      .object({
                        id: z.string(),
                        street_address: z.string(),
                        city: z.string(),
                        state: z.string(),
                        postal_code: z.string(),
                        country: z.string(),
                      })
                      .nullable(),
                  })
                  .nullable(),
                doctor: z
                  .object({
                    id: z.string(),
                    specialization: z.string(),
                    user: z.object({
                      id: z.string(),
                      name: z.string().nullable(),
                      email: z.string(),
                      image: z.string().nullable(),
                    }),
                  })
                  .nullable(),
              })
            ),
          })
        ),
        'Services retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_doctors_by_service: createRoute({
    method: 'get',
    tags: [API_TAGS.PATIENT],
    path: '/booking/services/{serviceId}/doctors',
    summary: 'Get doctors offering a specific service',
    description: 'Retrieve all doctors who offer a specific service (for consultation flow)',
    request: {
      params: z.object({
        serviceId: z.string().openapi({ description: 'Service ID' }),
      }),
      query: z.object({
        city: z.string().optional().openapi({ description: 'Filter by city' }),
        state: z.string().optional().openapi({ description: 'Filter by state' }),
        country: z.string().optional().openapi({ description: 'Filter by country' }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            service: ServiceSchema.extend({
              conditions: z.array(ServiceConditionSchema),
            }),
            doctors: z.array(
              z.object({
                id: z.string(),
                specialization: z.string(),
                consultation_fee: z.number().nullable(),
                bio: z.string().nullable(),
                averageRating: z.number(),
                totalReviews: z.number(),
                user: z.object({
                  id: z.string(),
                  name: z.string().nullable(),
                  email: z.string(),
                  image: z.string().nullable(),
                  phone_no: z.string().nullable(),
                }),
                clinic: z
                  .object({
                    id: z.string(),
                    clinic_name: z.string(),
                    address: z
                      .object({
                        id: z.string(),
                        street_address: z.string(),
                        city: z.string(),
                        state: z.string(),
                        postal_code: z.string(),
                        country: z.string(),
                      })
                      .nullable(),
                  })
                  .nullable(),
                services: z.array(
                  ServiceSchema.extend({
                    conditions: z.array(ServiceConditionSchema),
                  })
                ),
              })
            ),
          })
        ),
        'Doctors retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Service not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_doctor_details_with_timeslots: createRoute({
    method: 'get',
    tags: [API_TAGS.PATIENT],
    path: '/booking/doctors/{doctorId}',
    summary: 'Get doctor details with available timeslots',
    description: 'Retrieve doctor details including services, reviews, and available timeslots',
    request: {
      params: z.object({
        doctorId: z.string().openapi({ description: 'Doctor ID' }),
      }),
      query: z.object({
        date: z.string().optional().openapi({ description: 'Filter timeslots by date (ISO format)', example: '2024-12-01' }),
        isAvailable: z
          .string()
          .optional()
          .transform(val => val === 'true')
          .openapi({ description: 'Filter by availability', example: 'true' }),
        consultationType: z
          .enum(['BOTH', 'IN_PERSON', 'VIDEO_CALL'])
          .optional()
          .openapi({
            description: 'Filter by consultation type: BOTH, IN_PERSON, or VIDEO_CALL',
            example: 'IN_PERSON',
          }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            specialization: z.string(),
            consultation_fee: z.number().nullable(),
            bio: z.string().nullable(),
            experience_years: z.number().nullable(),
            averageRating: z.number(),
            totalReviews: z.number(),
            user: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              image: z.string().nullable(),
              phone_no: z.string().nullable(),
              dob: z.date().nullable(),
              gender: z.string().nullable(),
            }),
            clinic: z
              .object({
                id: z.string(),
                clinic_name: z.string(),
                address: z
                  .object({
                    id: z.string(),
                    street_address: z.string(),
                    city: z.string(),
                    state: z.string(),
                    postal_code: z.string(),
                    country: z.string(),
                  })
                  .nullable(),
                user: z.object({
                  id: z.string(),
                  name: z.string().nullable(),
                  email: z.string(),
                }),
              })
              .nullable(),
            services: z.array(
              ServiceSchema.extend({
                conditions: z.array(ServiceConditionSchema),
              })
            ),
            reviews: z.array(
              z.object({
                id: z.string(),
                rating: z.number(),
                review_text: z.string().nullable(),
                createdAt: z.date(),
                patient: z.object({
                  user: z.object({
                    id: z.string(),
                    name: z.string().nullable(),
                    image: z.string().nullable(),
                  }),
                }),
              })
            ),
            appointment_slots: z.array(Appointment_SlotSchema),
          })
        ),
        'Doctor details retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  add_to_cart: createRoute({
    method: 'post',
    tags: [API_TAGS.PATIENT],
    path: '/booking/cart',
    summary: 'Add service to cart',
    description: 'Add a service (product) to the patient cart',
    request: {
      body: jsonContentRequired(
        z.object({
          serviceId: z.string().openapi({ description: 'Service ID' }),
          quantity: z.number().int().min(1).default(1).openapi({ description: 'Quantity', example: 1 }),
        }),
        'Cart item data'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          CartSchema.extend({
            service: ServiceSchema.extend({
              conditions: z.array(ServiceConditionSchema),
            }),
          })
        ),
        'Item added to cart successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Invalid request'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Patient profile not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_cart: createRoute({
    method: 'get',
    tags: [API_TAGS.PATIENT],
    path: '/booking/cart',
    summary: 'Get patient cart',
    description: 'Retrieve all items in the patient cart',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            cartItems: z.array(
              CartSchema.extend({
                service: ServiceSchema.extend({
                  conditions: z.array(ServiceConditionSchema),
                  clinic: z
                    .object({
                      id: z.string(),
                      clinic_name: z.string(),
                      address: z
                        .object({
                          id: z.string(),
                          street_address: z.string(),
                          city: z.string(),
                          state: z.string(),
                          postal_code: z.string(),
                          country: z.string(),
                        })
                        .nullable(),
                    })
                    .nullable(),
                  doctor: z
                    .object({
                      id: z.string(),
                      user: z.object({
                        id: z.string(),
                        name: z.string().nullable(),
                        email: z.string(),
                        image: z.string().nullable(),
                      }),
                    })
                    .nullable(),
                }),
              })
            ),
          })
        ),
        'Cart retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Patient profile not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  remove_from_cart: createRoute({
    method: 'delete',
    tags: [API_TAGS.PATIENT],
    path: '/booking/cart/{cartItemId}',
    summary: 'Remove item from cart',
    description: 'Remove an item from the patient cart',
    request: {
      params: z.object({
        cartItemId: z.string().openapi({ description: 'Cart item ID' }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(CartSchema),
        'Item removed from cart successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Cart item not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  update_cart_quantity: createRoute({
    method: 'patch',
    tags: [API_TAGS.PATIENT],
    path: '/booking/cart/{cartItemId}',
    summary: 'Update cart item quantity',
    description: 'Update the quantity of an item in the patient cart',
    request: {
      params: z.object({
        cartItemId: z.string().openapi({ description: 'Cart item ID' }),
      }),
      body: jsonContentRequired(
        z.object({
          quantity: z.number().int().min(1).openapi({ description: 'New quantity', example: 2 }),
        }),
        'Quantity update data'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          CartSchema.extend({
            service: ServiceSchema.extend({
              conditions: z.array(ServiceConditionSchema),
            }),
          })
        ),
        'Cart item quantity updated successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Cart item not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),
} as const

