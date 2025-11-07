import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'

const PatientProfileRequestSchema = z.object({
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'Date of birth in ISO 8601 format (YYYY-MM-DD)', example: '1990-05-20' }),
  gender: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'Gender', example: 'Female' }),
  phoneCode: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'International phone country code', example: '+44' }),
  phoneNumber: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'Patient phone number', example: '7123 456 789' }),
  streetAddress: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'Street address', example: '10 Downing Street' }),
  city: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'City', example: 'London' }),
  state: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'State / County / Region', example: 'Greater London' }),
  postalCode: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'Postal/ZIP code', example: 'SW1A 2AA' }),
  country: z
    .string()
    .optional()
    .nullable()
    .openapi({ description: 'Country name', example: 'United Kingdom' }),
})

const PatientProfileResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  data: z.object({
    dateOfBirth: z.string().nullable(),
    gender: z.string().nullable(),
    phoneCode: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    streetAddress: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    postalCode: z.string().nullable(),
    country: z.string().nullable(),
    onboardingStage: z.string().nullable().optional(),
  }),
})

export const PATIENT_ROUTES = {
  update_my_patient_profile: createRoute({
    method: 'patch',
    tags: [API_TAGS.PATIENT],
    path: '/profile',
    summary: 'Update patient profile',
    description: 'Update personal and address details for the authenticated patient',
    request: {
      body: jsonContentRequired(PatientProfileRequestSchema, 'Patient profile fields to update'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        PatientProfileResponseSchema,
        'Patient profile updated successfully'
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

  get_my_patient_profile: createRoute({
    method: 'get',
    tags: [API_TAGS.PATIENT],
    path: '/profile',
    summary: 'Get patient profile',
    description: 'Retrieve personal and address details for the authenticated patient',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        PatientProfileResponseSchema,
        'Patient profile retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Patient profile not found'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),
}


