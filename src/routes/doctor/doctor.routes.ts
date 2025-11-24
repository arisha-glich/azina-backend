import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { DoctorSchema } from '~/zod/models'

const ClinicSummarySchema = z
  .object({
    id: z.string(),
    clinic_name: z.string().nullable(),
    is_active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi({ description: 'Summary of the linked clinic, if present' })

const DoctorClinicLinkStatusSchema = z
  .object({
    doctor_id: z.string(),
    clinic_id: z.string().nullable(),
    linked: z.boolean(),
    clinic: ClinicSummarySchema.nullable(),
  })
  .openapi({ description: 'Clinic link status for the authenticated doctor' })

// Schema for updating doctor fields
const DoctorUpdateSchema = z.object({
  specialization: z.string().optional().openapi({
    description: "Doctor's specialization",
    example: 'Cardiology',
  }),
  license_number: z.string().optional().openapi({
    description: "Doctor's license number",
    example: 'DOC123456',
  }),
  experience_years: z.number().int().optional().openapi({
    description: 'Years of experience',
    example: 10,
  }),
  bio: z.string().optional().openapi({
    description: "Doctor's biography",
    example: 'Experienced cardiologist with 10 years of practice',
  }),
  consultation_fee: z.number().optional().openapi({
    description: 'Consultation fee',
    example: 500.0,
  }),
  availability_status: z.string().optional().openapi({
    description: 'Availability status',
    example: 'AVAILABLE',
  }),
  phone_no: z.string().optional().openapi({
    description: "Doctor's phone number",
    example: '+1234567890',
  }),
  professional_email: z.string().email().optional().openapi({
    description: 'Professional email address',
    example: 'doctor@clinic.com',
  }),
  regulatoryBody: z.string().optional().openapi({
    description: 'Regulatory body',
    example: 'Medical Council',
  }),
  professional: z.string().optional().openapi({
    description: 'Professional designation',
    example: 'MD',
  }),
  areas_of_expertise: z
    .any()
    .optional()
    .openapi({
      description: 'Areas of expertise (array of strings or JSON object)',
      example: ['Cardiology', 'Internal Medicine'],
    }),
  resume: z
    .any()
    .optional()
    .openapi({
      description: 'Resume documents (URLs array or JSON object)',
      example: ['https://example.com/resume.pdf'],
    }),
  idemnityInsaurance: z
    .any()
    .optional()
    .openapi({
      description: 'Indemnity insurance documents (URLs array or JSON object)',
      example: ['https://example.com/insurance.pdf'],
    }),
  other_documents: z
    .any()
    .optional()
    .openapi({
      description: 'Other documents (URLs array or JSON object)',
      example: ['https://example.com/doc1.pdf', 'https://example.com/doc2.pdf'],
    }),
  signature: z.any().optional().openapi({
    description: 'Digital signature (URL or JSON object)',
    example: 'https://example.com/signature.png',
  }),
  Logo: z.any().optional().openapi({
    description: "Doctor's logo or photo (URL or JSON object)",
    example: 'https://example.com/logo.png',
  }),
  clinic_id: z.string().optional().openapi({
    description: 'Clinic ID the doctor belongs to',
    example: 'clinic123',
  }),
})

const DoctorProfessionalInfoSchema = z.object({
  license_number: z.string().min(1).openapi({ description: 'License number' }),
  regulatoryBody: z.string().min(1).openapi({ description: 'Regulatory body' }),
  professional_email: z.string().email().openapi({ description: 'Professional email' }),
})

const DoctorProfessionalDetailsSchema = z.object({
  specialization: z.string().min(1),
  experience_years: z.number().int().nonnegative(),
  professional: z.string().min(1),
  availability_status: z.string().min(1),
  bio: z.string().min(10),
  consultation_fee: z.number().nonnegative(),
  areas_of_expertise: z.any().optional().openapi({
    description: 'Areas of expertise (array or JSON object)',
    type: 'object',
  }),
})

const DoctorDocumentsSchema = z.object({
  resume: z.any().optional().openapi({
    description: 'Resume documents (URLs array or JSON object)',
    type: 'object',
  }),
  idemnityInsaurance: z.any().optional().openapi({
    description: 'Indemnity insurance documents (URLs array or JSON object)',
    type: 'object',
  }),
  other_documents: z.any().optional().openapi({
    description: 'Other documents (URLs array or JSON object)',
    type: 'object',
  }),
  signature: z.any().optional().openapi({
    description: 'Digital signature (URL or JSON object)',
    type: 'object',
  }),
  Logo: z.any().optional().openapi({
    description: 'Logo (URL or JSON object)',
    type: 'object',
  }),
})

const DoctorDocumentsNotificationResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  data: z.object({
    doctor: DoctorSchema,
    notificationTarget: z
      .enum(['clinic', 'admin', 'self', 'none'])
      .openapi({ description: 'Who received the notification email' }),
    notifiedAt: z
      .string()
      .openapi({ description: 'ISO-8601 timestamp when the notification was sent' }),
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

export const DOCTOR_ROUTES = {
  get_my_doctor: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/me',
    summary: "Get current user's doctor profile",
    description: 'Retrieve the doctor profile associated with the current authenticated user',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(DoctorSchema),
        'Doctor retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Doctor not found'
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

  get_my_clinic_link_status: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/me/clinic-link',
    summary: 'Check if current doctor is linked to a clinic',
    description:
      'Returns whether the authenticated doctor profile is currently linked to a clinic and basic clinic information when available.',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(DoctorClinicLinkStatusSchema),
        'Clinic link status retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Doctor profile not found'
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

  update_my_doctor: createRoute({
    method: 'patch',
    tags: [API_TAGS.DOCTOR],
    path: '/me',
    summary: "Update current user's doctor profile",
    description: 'Update the doctor profile associated with the current authenticated user',
    request: {
      body: jsonContentRequired(DoctorUpdateSchema, 'Doctor update payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(DoctorSchema),
        'Doctor updated successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Doctor not found'
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

  update_my_doctor_professional_info: createRoute({
    method: 'patch',
    tags: [API_TAGS.DOCTOR],
    path: '/me/professional-info',
    summary: 'Update professional info',
    description: 'Update license number, regulatory body and professional email',
    request: {
      body: jsonContentRequired(DoctorProfessionalInfoSchema, 'Professional info payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(DoctorSchema),
        'Professional info updated'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  create_my_doctor_professional_info: createRoute({
    method: 'post',
    tags: [API_TAGS.DOCTOR],
    path: '/me/professional-info',
    summary: 'Create/Update professional info',
    description: 'Create or update license number, regulatory body and professional email (no onboarding stage change)',
    request: {
      body: jsonContentRequired(DoctorProfessionalInfoSchema, 'Professional info payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            license_number: z.string().nullable(),
            regulatoryBody: z.string().nullable(),
            professional_email: z.string().nullable(),
          }),
        }),
        'Professional info updated'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_my_doctor_professional_info: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/me/professional-info',
    summary: 'Get professional info',
    description: 'Get license number, regulatory body and professional email',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            license_number: z.string().nullable(),
            regulatoryBody: z.string().nullable(),
            professional_email: z.string().nullable(),
          }),
        }),
        'Professional info retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  update_my_doctor_professional_details: createRoute({
    method: 'patch',
    tags: [API_TAGS.DOCTOR],
    path: '/me/professional-details',
    summary: 'Update professional details',
    description:
      'Update specialization, years of experience, designation, availability, bio, fee, expertise',
    request: {
      body: jsonContentRequired(DoctorProfessionalDetailsSchema, 'Professional details payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(DoctorSchema),
        'Professional details updated'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  create_my_doctor_professional_details: createRoute({
    method: 'post',
    tags: [API_TAGS.DOCTOR],
    path: '/me/professional-details',
    summary: 'Create/Update professional details',
    description:
      'Create or update specialization, years of experience, designation, availability, bio, fee, expertise (no onboarding stage change)',
    request: {
      body: jsonContentRequired(DoctorProfessionalDetailsSchema, 'Professional details payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            specialization: z.string().nullable(),
            experience_years: z.number().nullable(),
            professional: z.string().nullable(),
            availability_status: z.string().nullable(),
            bio: z.string().nullable(),
            consultation_fee: z.number().nullable(),
            areas_of_expertise: z.any().nullable().openapi({
              description: 'Areas of expertise (array or JSON object)',
              type: 'object',
            }),
          }),
        }),
        'Professional details updated'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_my_doctor_professional_details: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/me/professional-details',
    summary: 'Get professional details',
    description:
      'Get specialization, years of experience, designation, availability, bio, fee, expertise',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            specialization: z.string().nullable(),
            experience_years: z.number().nullable(),
            professional: z.string().nullable(),
            availability_status: z.string().nullable(),
            bio: z.string().nullable(),
            consultation_fee: z.number().nullable(),
            areas_of_expertise: z.any().nullable().openapi({
              description: 'Areas of expertise (array or JSON object)',
              type: 'object',
            }),
          }),
        }),
        'Professional details retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  update_my_doctor_documents: createRoute({
    method: 'patch',
    tags: [API_TAGS.DOCTOR],
    path: '/me/documents',
    summary: 'Update documents',
    description: 'Update resume, indemnity insurance, signature, logo and other documents',
    request: { body: jsonContentRequired(DoctorDocumentsSchema, 'Documents payload') },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        DoctorDocumentsNotificationResponseSchema,
        'Documents updated and notification email dispatched'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  create_my_doctor_documents: createRoute({
    method: 'post',
    tags: [API_TAGS.DOCTOR],
    path: '/me/documents',
    summary: 'Create/Update documents',
    description: 'Create or update resume, indemnity insurance, signature, logo and other documents (no onboarding stage change)',
    request: { body: jsonContentRequired(DoctorDocumentsSchema, 'Documents payload') },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        DoctorDocumentsNotificationResponseSchema,
        'Documents updated and notification email dispatched'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_my_doctor_documents: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/me/documents',
    summary: 'Get documents',
    description: 'Get resume, indemnity insurance, signature, logo and other documents',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            resume: z.any().nullable().openapi({
              description: 'Resume documents (URLs array or JSON object)',
              type: 'object',
            }),
            idemnityInsaurance: z.any().nullable().openapi({
              description: 'Indemnity insurance documents (URLs array or JSON object)',
              type: 'object',
            }),
            other_documents: z.any().nullable().openapi({
              description: 'Other documents (URLs array or JSON object)',
              type: 'object',
            }),
            signature: z.any().nullable().openapi({
              description: 'Digital signature (URL or JSON object)',
              type: 'object',
            }),
            Logo: z.any().nullable().openapi({
              description: 'Logo (URL or JSON object)',
              type: 'object',
            }),
          }),
        }),
        'Documents retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_my_requests: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/requests',
    summary: 'Get my approval requests',
    description: 'Fetch approval requests for the current doctor user with optional status filter',
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
    tags: [API_TAGS.DOCTOR],
    path: '/requests/latest',
    summary: 'Get latest approval request',
    description:
      'Fetch latest approval request for the current doctor user filtered by optional status',
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
    tags: [API_TAGS.DOCTOR],
    path: '/request-status',
    summary: "Get current user's approval request status",
    description: 'Retrieve the approval request status for the current doctor',
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

  get_approved_doctors: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/approved',
    summary: 'Get all approved doctors',
    description: 'Retrieve all doctors whose onboarding_stage is APPROVED_BY_ADMIN',
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
            })
          )
        ),
        'Approved doctors retrieved successfully'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_doctor_by_id: createRoute({
    method: 'get',
    tags: [API_TAGS.DOCTOR],
    path: '/{id}',
    summary: 'Get doctor by ID with full details',
    description: 'Retrieve a doctor by ID including full Doctor and User schema details',
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
          })
        ),
        'Doctor retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Doctor not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),
}
