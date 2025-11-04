import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { UserSchema } from '~/zod/models'

// Schema for updating user role
const UserRoleUpdateSchema = z.object({
  role: z.enum(['GUEST', 'PATIENT', 'DOCTOR', 'CLINIC', 'ADMIN']).openapi({
    description: 'User role',
    example: 'DOCTOR',
  }),
})

// Response schema for onboarding stage
const OnboardingStageSchema = z.object({
  onboarding_stage: z.string().nullable().openapi({
    description: "User's current onboarding stage",
    example: 'CLINIC_APPROVAL_PENDING',
  }),
})

// Schema for updating onboarding stage
const UpdateOnboardingStageSchema = z.object({
  onboarding_stage: z.string().openapi({
    description: 'New onboarding stage value',
    example: 'APPROVED_BY_ADMIN',
  }),
})

export const USER_ROUTES = {
  get_my_onboarding_stage: createRoute({
    method: 'get',
    tags: [API_TAGS.USER],
    path: '/onboarding-stage',
    summary: "Get current user's onboarding stage",
    description: 'Retrieve the onboarding stage of the currently authenticated user',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        OnboardingStageSchema,
        'Onboarding stage retrieved successfully'
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

  update_my_onboarding_stage: createRoute({
    method: 'patch',
    tags: [API_TAGS.USER],
    path: '/onboarding-stage',
    summary: "Update current user's onboarding stage",
    description: 'Update the onboarding stage of the currently authenticated user',
    request: {
      body: jsonContentRequired(UpdateOnboardingStageSchema, 'Onboarding stage update payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            id: z.string(),
            email: z.string(),
            onboarding_stage: z.string().nullable(),
          }),
        }),
        'Onboarding stage updated successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'User not found'
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

  update_user_role: createRoute({
    method: 'patch',
    tags: [API_TAGS.USER],
    path: '/role',
    summary: 'Update user role',
    description: "Update a user's role. Valid roles: GUEST, PATIENT, DOCTOR, CLINIC, ADMIN",
    request: {
      body: jsonContentRequired(UserRoleUpdateSchema, 'User role update payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(UserSchema),
        'User role updated successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Unauthorized'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'User not found'
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

  get_my_permissions: createRoute({
    method: 'get',
    tags: [API_TAGS.USER],
    path: '/permissions',
    summary: 'Get current user permissions',
    description: 'Retrieve all permissions for the currently authenticated user',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            userId: z.string(),
            role: z.string().nullable(),
            dynamicRole: z
              .object({
                id: z.string(),
                name: z.string(),
                displayName: z.string(),
              })
              .nullable(),
            permissions: z.array(
              z.object({
                resource: z.string(),
                action: z.string(),
              })
            ),
          }),
        }),
        'Permissions retrieved successfully'
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
}
