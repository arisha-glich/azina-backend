import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { Appointment_SlotSchema, DoctorSchema } from '~/zod/models'

const CreateTimeslotSchema = z
  .object({
    slot_date: z.string().openapi({ description: 'Slot date in ISO format', example: '2024-12-01' }),
    start_time: z.string().openapi({ description: 'Start time in HH:mm format', example: '09:00' }),
    end_time: z.string().openapi({ description: 'End time in HH:mm format', example: '10:00' }),
    is_available: z.boolean().default(true).openapi({ description: 'Whether the slot is available', example: true }),
    consultation_type: z
      .enum(['BOTH', 'IN_PERSON', 'VIDEO_CALL'])
      .default('BOTH')
      .openapi({
        description: 'Consultation type: BOTH (default), IN_PERSON, or VIDEO_CALL',
        example: 'BOTH',
      }),
  })
  .openapi({ description: 'Timeslot creation payload' })

const UpdateTimeslotSchema = z
  .object({
    slot_date: z.string().optional().openapi({ description: 'Slot date in ISO format', example: '2024-12-01' }),
    start_time: z.string().optional().openapi({ description: 'Start time in HH:mm format', example: '09:00' }),
    end_time: z.string().optional().openapi({ description: 'End time in HH:mm format', example: '10:00' }),
    is_available: z.boolean().optional().openapi({ description: 'Whether the slot is available', example: true }),
    consultation_type: z
      .enum(['BOTH', 'IN_PERSON', 'VIDEO_CALL'])
      .optional()
      .openapi({
        description: 'Consultation type: BOTH, IN_PERSON, or VIDEO_CALL',
        example: 'IN_PERSON',
      }),
  })
  .openapi({ description: 'Timeslot update payload' })

const BulkCreateTimeslotSchema = z
  .object({
    timeslots: z.array(CreateTimeslotSchema).min(1).openapi({ description: 'Array of timeslots to create' }),
  })
  .openapi({ description: 'Bulk timeslot creation payload' })

export const TIMESLOT_ROUTES = {
  create_timeslot: createRoute({
    method: 'post',
    tags: [API_TAGS.DOCTOR],
    path: '/',
    summary: 'Create a timeslot',
    description: 'Create a new timeslot for the authenticated doctor (linked or individual)',
    request: {
      body: jsonContentRequired(CreateTimeslotSchema, 'Timeslot data'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(
          Appointment_SlotSchema.extend({
            doctor: z.object({
              id: z.string(),
              user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
              }),
            }),
          })
        ),
        'Timeslot created successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Invalid request or overlapping timeslot'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor profile not found'
      ),
      [HttpStatusCodes.CONFLICT]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Timeslot overlaps with existing slot'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  create_bulk_timeslots: createRoute({
    method: 'post',
    tags: [API_TAGS.DOCTOR],
    path: '/bulk',
    summary: 'Create multiple timeslots',
    description: 'Create multiple timeslots at once for the authenticated doctor',
    request: {
      body: jsonContentRequired(BulkCreateTimeslotSchema, 'Bulk timeslot data'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(
          z.object({
            created: z.array(
              Appointment_SlotSchema.extend({
                doctor: z.object({
                  id: z.string(),
                  user: z.object({
                    id: z.string(),
                    name: z.string().nullable(),
                    email: z.string(),
                  }),
                }),
              })
            ),
            errors: z.array(
              z.object({
                payload: CreateTimeslotSchema,
                error: z.string(),
              })
            ),
          })
        ),
        'Timeslots created (with any errors)'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Invalid request'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor profile not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_timeslots: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/',
    summary: 'Get timeslots with pagination and filters',
    description: 'Retrieve timeslots for the authenticated doctor with pagination and filtering options',
    request: {
      query: z.object({
        date: z.string().optional().openapi({ description: 'Filter by specific date (ISO format)', example: '2024-12-01' }),
        startDate: z.string().optional().openapi({ description: 'Filter by start date (ISO format)', example: '2024-12-01' }),
        endDate: z.string().optional().openapi({ description: 'Filter by end date (ISO format)', example: '2024-12-31' }),
        isAvailable: z
          .string()
          .optional()
          .transform(val => val === 'true')
          .openapi({ description: 'Filter by availability', example: 'true' }),
        startTime: z.string().optional().openapi({ description: 'Filter by start time (HH:mm)', example: '09:00' }),
        endTime: z.string().optional().openapi({ description: 'Filter by end time (HH:mm)', example: '17:00' }),
        consultationType: z
          .enum(['BOTH', 'IN_PERSON', 'VIDEO_CALL'])
          .optional()
          .openapi({
            description: 'Filter by consultation type: BOTH, IN_PERSON, or VIDEO_CALL',
            example: 'IN_PERSON',
          }),
        page: z
          .string()
          .optional()
          .transform(val => (val ? Number.parseInt(val, 10) : 1))
          .openapi({ description: 'Page number', example: '1' }),
        limit: z
          .string()
          .optional()
          .transform(val => (val ? Number.parseInt(val, 10) : 20))
          .openapi({ description: 'Items per page', example: '20' }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            timeslots: z.array(
              Appointment_SlotSchema.extend({
                doctor: z.object({
                  id: z.string(),
                  user: z.object({
                    id: z.string(),
                    name: z.string().nullable(),
                    email: z.string(),
                  }),
                }),
                appointments: z.array(
                  z.object({
                    id: z.string(),
                    status: z.string(),
                    appointment_date: z.date(),
                    appointment_time: z.string(),
                  })
                ),
                _count: z.object({
                  appointments: z.number(),
                }),
              })
            ),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
            doctor: DoctorSchema.nullable(),
          })
        ),
        'Timeslots retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor profile not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_timeslot_by_id: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/{timeslotId}',
    summary: 'Get a timeslot by ID',
    description: 'Retrieve a specific timeslot by ID for the authenticated doctor',
    request: {
      params: z.object({
        timeslotId: z.string().openapi({ description: 'Timeslot ID' }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          Appointment_SlotSchema.extend({
            doctor: z.object({
              id: z.string(),
              user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
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
            }),
            appointments: z.array(
              z.object({
                id: z.string(),
                status: z.string(),
                patient: z.object({
                  user: z.object({
                    id: z.string(),
                    name: z.string().nullable(),
                    email: z.string(),
                  }),
                }),
                service: z.object({
                  id: z.string(),
                  service_name: z.string(),
                }),
              })
            ),
          })
        ),
        'Timeslot retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Timeslot not found'
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

  update_timeslot: createRoute({
    method: 'patch',
    tags: [API_TAGS.DOCTOR],
    path: '/{timeslotId}',
    summary: 'Update a timeslot',
    description: 'Update an existing timeslot for the authenticated doctor',
    request: {
      params: z.object({
        timeslotId: z.string().openapi({ description: 'Timeslot ID' }),
      }),
      body: jsonContentRequired(UpdateTimeslotSchema, 'Timeslot update data'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          Appointment_SlotSchema.extend({
            doctor: z.object({
              id: z.string(),
              user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
              }),
            }),
            appointments: z.array(
              z.object({
                id: z.string(),
                status: z.string(),
              })
            ),
          })
        ),
        'Timeslot updated successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Invalid request or overlapping timeslot'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Timeslot not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.CONFLICT]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Timeslot overlaps with existing slot'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  delete_timeslot: createRoute({
    method: 'delete',
    tags: [API_TAGS.DOCTOR],
    path: '/{timeslotId}',
    summary: 'Delete a timeslot',
    description: 'Delete a timeslot for the authenticated doctor (cannot delete if has active appointments)',
    request: {
      params: z.object({
        timeslotId: z.string().openapi({ description: 'Timeslot ID' }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(Appointment_SlotSchema),
        'Timeslot deleted successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Cannot delete timeslot with active appointments'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Timeslot not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized to delete this time slot'
      ),
      [HttpStatusCodes.CONFLICT]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Cannot delete time slot with active appointments'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  delete_all_timeslots: createRoute({
    method: 'delete',
    tags: [API_TAGS.DOCTOR],
    path: '/',
    summary: 'Delete all timeslots',
    description: 'Delete all timeslots for the authenticated doctor (only deletes slots without active appointments)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            deleted: z.number().openapi({ description: 'Number of timeslots deleted' }),
            skipped: z.number().openapi({ description: 'Number of timeslots skipped (have active appointments)' }),
          })
        ),
        'Timeslots deleted successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor profile not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),
} as const
