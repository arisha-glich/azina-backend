import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { ClinicSchema, DoctorSchema, UserSchema } from '~/zod/models'

// Schema for updating clinic fields
const ClinicUpdateSchema = z.object({
  clinic_name: z.string().optional().openapi({
    description: 'Clinic name',
    example: 'City Health Clinic',
  }),
  address_id: z.string().optional().openapi({
    description: 'Address ID',
    example: 'addr123',
  }),
  phone_number: z.string().optional().openapi({
    description: 'Clinic phone number',
    example: '+1234567890',
  }),
  email: z.string().email().optional().openapi({
    description: 'Clinic email',
    example: 'info@cityhealth.com',
  }),
  website: z.string().optional().openapi({
    description: 'Clinic website',
    example: 'https://www.clinic.com',
  }),
  license_no: z.string().optional().openapi({
    description: 'Clinic license number',
    example: 'LIC123456',
  }),
  clinicLogo: z.any().optional().openapi({
    description: 'Clinic logo (URL or JSON object)',
    example: 'https://example.com/clinic-logo.png',
  }),
  companyRegistrationCertificate: z.any().optional().openapi({
    description: 'Company registration certificate (URL or JSON object)',
    example: 'https://example.com/certificate.pdf',
  }),
  proofOfBusinessAddress: z.any().optional().openapi({
    description: 'Proof of business address (URL or JSON object)',
    example: 'https://example.com/proof.pdf',
  }),
  registrationCertificate: z.any().optional().openapi({
    description: 'Registration certificate (URL or JSON object)',
    example: 'https://example.com/registration.pdf',
  }),
  otherDocuments: z
    .any()
    .optional()
    .openapi({
      description: 'Other documents (URLs array or JSON object)',
      example: ['https://example.com/doc1.pdf', 'https://example.com/doc2.pdf'],
    }),
  Logo: z.any().optional().openapi({
    description: 'Clinic logo (URL or JSON object)',
    example: 'https://example.com/logo.png',
  }),
  signature: z.any().optional().openapi({
    description: 'Authorized signature (URL or JSON object)',
    example: 'https://example.com/signature.png',
  }),
  opening_time: z.string().optional().openapi({
    description: 'Opening time',
    example: '09:00',
  }),
  closing_time: z.string().optional().openapi({
    description: 'Closing time',
    example: '17:00',
  }),
  is_active: z.boolean().optional().openapi({
    description: 'Whether clinic is active',
    example: true,
  }),
})

const ClinicDocumentsSchema = z.object({
  clinicLogo: z.any().optional().openapi({
    description: 'Clinic logo asset (URL/key/JSON)',
    type: 'object',
  }),
  companyRegistrationCertificate: z.any().optional().openapi({
    description: 'Company registration certificate documents',
    type: 'object',
  }),
  proofOfBusinessAddress: z.any().optional().openapi({
    description: 'Proof of business address documents',
    type: 'object',
  }),
  registrationCertificate: z.any().optional().openapi({
    description: 'Registration certificates',
    type: 'object',
  }),
  otherDocuments: z.any().optional().openapi({
    description: 'Other supporting documents (array, URL or JSON)',
    type: 'object',
  }),
  signature: z.any().optional().openapi({
    description: 'Authorised signature asset',
    type: 'object',
  }),
  Logo: z.any().optional().openapi({
    description: 'Legacy logo asset',
    type: 'object',
  }),
})

const ClinicDocumentsNotificationResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  data: z.object({
    clinic: ClinicSchema,
    notificationTarget: z
      .enum(['admin', 'none'])
      .openapi({ description: 'Who was notified about the document update' }),
    notifiedAt: z
      .string()
      .openapi({ description: 'ISO timestamp when the notification was sent' }),
  }),
})

const ClinicDocumentsResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  data: z.object({
    clinicLogo: z.any().nullable(),
    companyRegistrationCertificate: z.any().nullable(),
    proofOfBusinessAddress: z.any().nullable(),
    registrationCertificate: z.any().nullable(),
    otherDocuments: z.any().nullable(),
    signature: z.any().nullable(),
    Logo: z.any().nullable(),
  }),
})

const RequestItemSchema = z.object({
  id: z.string(),
  request_type: z.string(),
  status: z.string(),
  rejection_reason: z.string().nullable(),
  reviewed_at: z.date().nullable(),
  createdAt: z.date(),
  request_data: z.any().nullable().openapi({
    description: 'Request data (JSON object)',
    type: 'object',
  }),
  entity: z.any().nullable().openapi({
    description: 'Entity data (Doctor or Clinic object)',
    type: 'object',
  }),
  user: z.object({ id: z.string(), email: z.string(), name: z.string().nullable().optional() }),
})

export const CLINIC_ROUTES = {
  get_my_clinic: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/me',
    summary: "Get current user's clinic",
    description: 'Retrieve the clinic associated with the current authenticated user',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(ClinicSchema),
        'Clinic retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Clinic not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Internal server error'
      ),
    },
  }),

  update_my_clinic: createRoute({
    method: 'patch',
    tags: [API_TAGS.CLINIC],
    path: '/me',
    summary: "Update current user's clinic",
    description: 'Update the clinic associated with the current authenticated user',
    request: {
      body: jsonContentRequired(ClinicUpdateSchema, 'Clinic update payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(ClinicSchema),
        'Clinic updated successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Clinic not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Internal server error'
      ),
    },
  }),

  update_my_clinic_documents: createRoute({
    method: 'patch',
    tags: [API_TAGS.CLINIC],
    path: '/me/documents',
    summary: 'Update clinic documents',
    description:
      'Update clinic compliance documents (logo, certificates, etc.) and notify administrators',
    request: {
      body: jsonContentRequired(ClinicDocumentsSchema, 'Clinic document payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        ClinicDocumentsNotificationResponseSchema,
        'Clinic documents updated successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Clinic not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_my_clinic_documents: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/me/documents',
    summary: 'Get clinic documents',
    description: 'Retrieve clinic compliance documents (logo, certificates, etc.)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        ClinicDocumentsResponseSchema,
        'Clinic documents retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Clinic not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  create_my_clinic: createRoute({
    method: 'post',
    tags: [API_TAGS.CLINIC],
    path: '/me',
    summary: 'Create/Update clinic profile',
    description: 'Create or update clinic profile without changing onboarding stage (no approval routing)',
    request: {
      body: jsonContentRequired(ClinicUpdateSchema, 'Clinic update payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(ClinicSchema),
        'Clinic updated successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Clinic not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Internal server error'
      ),
    },
  }),

  get_my_requests: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/requests',
    summary: 'Get my approval requests',
    description: 'Fetch approval requests for the current clinic user with optional status filter',
    request: {
      query: z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional() }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({ message: z.string(), success: z.boolean(), data: z.array(RequestItemSchema) }),
        'Requests retrieved successfully'
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

  get_my_latest_request: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/requests/latest',
    summary: 'Get latest approval request',
    description:
      'Fetch latest approval request for the current clinic user filtered by optional status',
    request: {
      query: z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional() }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({ message: z.string(), success: z.boolean(), data: RequestItemSchema.nullable() }),
        'Latest request retrieved successfully'
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

  get_my_request_status: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/request-status',
    summary: "Get current user's approval request status",
    description: 'Retrieve the approval request status for the current clinic',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z
            .object({
              id: z.string(),
              request_type: z.string(),
              status: z.string(),
              rejection_reason: z.string().nullable(),
              reviewed_at: z.date().nullable(),
              createdAt: z.date(),
            })
            .nullable(),
        }),
        'Request status retrieved successfully'
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

  get_approved_clinics: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/approved',
    summary: 'Get all approved clinics',
    description: 'Retrieve all clinics whose onboarding_stage is APPROVED_BY_ADMIN',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.array(
            ClinicSchema.extend({
              user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                image: z.string().nullable(),
                role: z.string(),
                phone_no: z.string().nullable(),
                dob: z.date().nullable(),
                gender: z.string().nullable(),
                onboarding_stage: z.string().nullable(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
              address: z
                .object({
                  id: z.string(),
                  street_address: z.string(),
                  city: z.string(),
                  state: z.string(),
                  postal_code: z.string(),
                  country: z.string(),
                  latitude: z.number().nullable(),
                  longitude: z.number().nullable(),
                  is_active: z.boolean(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                })
                .nullable(),
            })
          )
        ),
        'Approved clinics retrieved successfully'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_clinic_by_id: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/{id}',
    summary: 'Get clinic by ID with full details',
    description: 'Retrieve a clinic by ID including full Clinic and User schema details',
    request: {
      params: z.object({
        id: z.string().openapi({
          param: { name: 'id', in: 'path' },
          description: 'Clinic ID',
          example: 'clinic123',
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          ClinicSchema.extend({
            user: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              image: z.string().nullable(),
              role: z.string(),
              phone_no: z.string().nullable(),
              dob: z.date().nullable(),
              gender: z.string().nullable(),
              onboarding_stage: z.string().nullable(),
              emailVerified: z.boolean(),
              banned: z.boolean(),
              banReason: z.string().nullable(),
              banExpiresAt: z.date().nullable(),
              meta: z.any().nullable().openapi({
                description: 'User metadata (JSON object)',
                type: 'object',
              }),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
            address: z
              .object({
                id: z.string(),
                street_address: z.string(),
                city: z.string(),
                state: z.string(),
                postal_code: z.string(),
                country: z.string(),
                latitude: z.number().nullable(),
                longitude: z.number().nullable(),
                is_active: z.boolean(),
                createdAt: z.date(),
                updatedAt: z.date(),
              })
              .nullable(),
            doctors: z
              .array(
                z.object({
                  id: z.string(),
                  specialization: z.string(),
                  user: z.object({
                    id: z.string(),
                    name: z.string().nullable(),
                    email: z.string(),
                    image: z.string().nullable(),
                  }),
                })
              )
              .optional(),
          })
        ),
        'Clinic retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Clinic not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_clinic_doctors: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/doctors',
    summary: 'Get approved doctors for logged-in clinic',
    description:
      "Retrieve all doctors with onboarding_stage = 'APPROVED_BY_ADMIN' that belong to the clinic of the authenticated user.",
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.array(
            DoctorSchema.extend({
              user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                image: z.string().nullable(),
                role: z.string(),
                phone_no: z.string().nullable(),
                dob: z.date().nullable(),
                gender: z.string().nullable(),
                onboarding_stage: z.string().nullable(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
              clinic: ClinicSchema.pick({
                id: true,
                clinic_name: true,
                user_id: true,
              }).nullable(),
            })
          )
        ),
        'Clinic doctors retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Clinic not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_clinic_doctor_by_id: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/doctors/{id}',
    summary: 'Get clinic doctor by ID with full details',
    description:
      'Retrieve a specific doctor by ID that belongs to the logged-in clinic, including full Doctor and User schema details',
    request: {
      params: z.object({
        id: z.string().openapi({
          param: { name: 'id', in: 'path' },
          description: 'Doctor ID',
          example: 'doc123',
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          DoctorSchema.extend({
            user: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              image: z.string().nullable(),
              role: z.string(),
              phone_no: z.string().nullable(),
              dob: z.date().nullable(),
              gender: z.string().nullable(),
              onboarding_stage: z.string().nullable(),
              emailVerified: z.boolean(),
              banned: z.boolean(),
              banReason: z.string().nullable(),
              banExpiresAt: z.date().nullable(),
              meta: z.any().nullable().openapi({
                description: 'User metadata (JSON object)',
                type: 'object',
              }),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
            clinic: ClinicSchema.extend({
              address: z
                .object({
                  id: z.string(),
                  street_address: z.string(),
                  city: z.string(),
                  state: z.string(),
                  postal_code: z.string(),
                  country: z.string(),
                  latitude: z.number().nullable(),
                  longitude: z.number().nullable(),
                  is_active: z.boolean(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                })
                .nullable(),
              user: z
                .object({
                  id: z.string(),
                  name: z.string().nullable(),
                  email: z.string(),
                })
                .nullable(),
            }).nullable(),
          })
        ),
        'Clinic doctor retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Clinic or doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  create_doctor: createRoute({
    method: 'post',
    tags: [API_TAGS.CLINIC],
    path: '/doctors',
    summary: 'Create doctor and link to logged-in clinic',
    description:
      'Creates a user with DOCTOR role, doctor profile, and links to the clinic of the logged-in user. Sends email to doctor with profile setup instructions.',
    request: {
      body: jsonContentRequired(
        z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          email: z.string().email('Valid email is required'),
          password: z.string().min(8, 'Password must be at least 8 characters'),
          specialization: z.string().min(1, 'Specialization is required'),
          license_number: z.string().min(1, 'License number is required'),
          phone_no: z.string().optional(),
        }),
        'Doctor creation payload'
      ),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(
          z.object({
            user: UserSchema,
            doctor: DoctorSchema.extend({
              clinic: ClinicSchema.nullable(),
            }),
          })
        ),
        'Doctor created successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Only clinic users can create doctors'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Clinic not found for this user'
      ),
      [HttpStatusCodes.CONFLICT]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Email or license number already exists'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  // Clinic Approval Routes
  get_clinic_requests: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/requests',
    summary: 'Get all doctor approval requests for logged-in clinic',
    description:
      'Retrieves all approval requests submitted by doctors linked to this clinic. Optionally filter by status.',
    request: {
      query: z.object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional().openapi({
          description: 'Filter requests by status',
          example: 'PENDING',
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.array(
            z.object({
              id: z.string(),
              request_type: z.string(),
              status: z.string(),
              rejection_reason: z.string().nullable(),
              reviewed_at: z.date().nullable(),
              renewal_date: z.date().nullable(),
              createdAt: z.date(),
              request_data: z.any().nullable().openapi({
                description: 'Request data (JSON object)',
                type: 'object',
              }),
              entity: z.any().nullable().openapi({
                description: 'Entity data (Doctor or Clinic object)',
                type: 'object',
              }), // Doctor with user and clinic
              user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                role: z.string(),
                onboarding_stage: z.string().nullable(),
                phone_no: z.string().nullable(),
                image: z.string().nullable(),
              }),
            })
          )
        ),
        'Requests retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Only clinic users can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Clinic not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_clinic_request_by_id: createRoute({
    method: 'get',
    tags: [API_TAGS.CLINIC],
    path: '/requests/{id}',
    summary: 'Get approval request details by ID',
    description:
      'Retrieves full details of a specific approval request including doctor profile, user data, and all documents.',
    request: {
      params: z.object({
        id: z.string().openapi({
          description: 'Approval request ID',
          example: 'req123',
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            request_type: z.string(),
            status: z.string(),
            rejection_reason: z.string().nullable(),
            reviewed_at: z.date().nullable(),
            reviewed_by: z.string().nullable(),
            renewal_date: z.date().nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
            request_data: z.any().nullable().openapi({
              description: 'Request data (JSON object)',
              type: 'object',
            }),
            entity: z.any().nullable().openapi({
              description: 'Entity data (Doctor or Clinic object)',
              type: 'object',
            }), // Full Doctor with user and clinic
            user: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              role: z.string(),
              onboarding_stage: z.string().nullable(),
              image: z.string().nullable(),
              phone_no: z.string().nullable(),
              gender: z.string().nullable(),
              dob: z.date().nullable(),
              banned: z.boolean(),
              banReason: z.string().nullable(),
              banExpiresAt: z.date().nullable(),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
          })
        ),
        'Request details retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Only clinic users can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Request not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  approve_clinic_request: createRoute({
    method: 'patch',
    tags: [API_TAGS.CLINIC],
    path: '/requests/{id}/approve',
    summary: "Approve a doctor's profile update request",
    description:
      "Approves a doctor's profile update request and sets onboarding_stage to APPROVED_BY_CLINIC. Optionally sets a renewal date for future review.",
    request: {
      params: z.object({
        id: z.string().openapi({
          description: 'Approval request ID',
          example: 'req123',
        }),
      }),
      body: jsonContentRequired(
        z.object({
          renewal_date: z.string().datetime().optional().openapi({
            description: 'Date when clinic should review this doctor again (ISO 8601 format)',
            example: '2025-12-31T00:00:00Z',
          }),
        }),
        'Approval payload'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            status: z.string(),
            reviewed_at: z.date(),
            reviewed_by: z.string(),
            renewal_date: z.date().nullable(),
            entity: z.any().nullable().openapi({
              description: 'Entity data (Doctor or Clinic object)',
              type: 'object',
            }),
            user: z.object({
              id: z.string(),
              onboarding_stage: z.string(),
            }),
          })
        ),
        'Request approved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Only clinic users can approve requests'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Request not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  reject_clinic_request: createRoute({
    method: 'patch',
    tags: [API_TAGS.CLINIC],
    path: '/requests/{id}/reject',
    summary: "Reject a doctor's profile update request",
    description:
      "Rejects a doctor's profile update request with a reason and sets onboarding_stage to CLINIC_REJECT_DOCTOR.",
    request: {
      params: z.object({
        id: z.string().openapi({
          description: 'Approval request ID',
          example: 'req123',
        }),
      }),
      body: jsonContentRequired(
        z.object({
          rejection_reason: z.string().min(1).openapi({
            description: 'Reason for rejection',
            example: 'License number verification failed',
          }),
        }),
        'Rejection payload'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            status: z.string(),
            rejection_reason: z.string(),
            reviewed_at: z.date(),
            reviewed_by: z.string(),
            entity: z.any().nullable().openapi({
              description: 'Entity data (Doctor or Clinic object)',
              type: 'object',
            }),
            user: z.object({
              id: z.string(),
              onboarding_stage: z.string(),
            }),
          })
        ),
        'Request rejected successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Only clinic users can reject requests'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Request not found'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Rejection reason is required'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),
}
