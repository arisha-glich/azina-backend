import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { ServiceConditionSchema, ServiceSchema } from '~/zod/models'

const ServiceConditionInputSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .openapi({ description: 'Condition name', example: 'Initial consultation' }),
    description: z
      .string()
      .optional()
      .openapi({ description: 'Condition description', example: 'Includes first visit follow-up' }),
    price: z
      .number()
      .nonnegative()
      .openapi({ description: 'Condition price', example: 150 }),
    offer_as_product: z
      .boolean()
      .optional()
      .openapi({ description: 'Whether this condition should be offered as a product', example: true }),
  })
  .openapi({ description: 'Service condition input schema' })

const ServiceCreateSchema = z
  .object({
    service_name: z
      .string()
      .min(1)
      .openapi({ description: 'Service name', example: 'General Consultation' }),
    description: z
      .string()
      .optional()
      .openapi({ description: 'Detailed description of the service', example: '30 minute consultation' }),
    conditions: z
      .array(ServiceConditionInputSchema)
      .optional()
      .openapi({
        description: 'Optional list of service-specific conditions created alongside the service',
      }),
  })
  .openapi({ description: 'Service creation payload schema' })

const ServiceUpdateSchema = z
  .object({
    service_name: z
      .string()
      .min(1)
      .optional()
      .openapi({ description: 'Service name', example: 'Updated Consultation' }),
    description: z
      .string()
      .optional()
      .openapi({ description: 'Service description', example: 'Updated description for the service' }),
  })
  .openapi({ description: 'Service update payload schema' })

const ServiceWithConditionsSchema = ServiceSchema.extend({
  conditions: z.array(ServiceConditionSchema),
})

export const SERVICE_ROUTES = {
  list_services: createRoute({
    method: 'get',
    tags: [API_TAGS.SERVICE],
    path: '/',
    summary: 'List services for the authenticated clinic or standalone doctor',
    description: 'Retrieve all services owned by the authenticated clinic or doctor (without clinic association).',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            services: z.array(ServiceWithConditionsSchema),
          })
        ),
        'Services retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  create_service: createRoute({
    method: 'post',
    tags: [API_TAGS.SERVICE],
    path: '/',
    summary: 'Create a new service',
    description:
      'Create a new service owned by the authenticated clinic or standalone doctor, optionally with initial conditions.',
    request: {
      body: jsonContentRequired(ServiceCreateSchema, 'Service creation payload'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(ServiceWithConditionsSchema),
        'Service created successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  get_service_by_id: createRoute({
    method: 'get',
    tags: [API_TAGS.SERVICE],
    path: '/{serviceId}',
    summary: 'Retrieve a specific service',
    description: 'Retrieve a service owned by the authenticated clinic or standalone doctor by its identifier.',
    request: {
      params: z.object({
        serviceId: z.string().openapi({
          param: { name: 'serviceId', in: 'path' },
          description: 'Service identifier',
          example: 'svc_123',
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(ServiceWithConditionsSchema),
        'Service retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Service not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  update_service: createRoute({
    method: 'patch',
    tags: [API_TAGS.SERVICE],
    path: '/{serviceId}',
    summary: 'Update a service',
    description: 'Update a service owned by the authenticated clinic or standalone doctor.',
    request: {
      params: z.object({
        serviceId: z.string().openapi({
          param: { name: 'serviceId', in: 'path' },
          description: 'Service identifier',
          example: 'svc_123',
        }),
      }),
      body: jsonContentRequired(ServiceUpdateSchema, 'Service update payload'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(ServiceWithConditionsSchema),
        'Service updated successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Service not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  delete_service: createRoute({
    method: 'delete',
    tags: [API_TAGS.SERVICE],
    path: '/{serviceId}',
    summary: 'Delete a service',
    description: 'Delete a service owned by the authenticated clinic or standalone doctor.',
    request: {
      params: z.object({
        serviceId: z.string().openapi({
          param: { name: 'serviceId', in: 'path' },
          description: 'Service identifier',
          example: 'svc_123',
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(ServiceWithConditionsSchema),
        'Service deleted successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Service not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  list_conditions: createRoute({
    method: 'get',
    tags: [API_TAGS.SERVICE],
    path: '/{serviceId}/conditions',
    summary: 'List conditions for a service',
    description: 'List all conditions associated with a service owned by the authenticated clinic or standalone doctor.',
    request: {
      params: z.object({
        serviceId: z.string().openapi({
          param: { name: 'serviceId', in: 'path' },
          description: 'Service identifier',
          example: 'svc_123',
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            conditions: z.array(ServiceConditionSchema),
          })
        ),
        'Service conditions retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Service not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  create_condition: createRoute({
    method: 'post',
    tags: [API_TAGS.SERVICE],
    path: '/{serviceId}/conditions',
    summary: 'Create a new condition for a service',
    description: 'Create a new condition for a service owned by the authenticated clinic or standalone doctor.',
    request: {
      params: z.object({
        serviceId: z.string().openapi({
          param: { name: 'serviceId', in: 'path' },
          description: 'Service identifier',
          example: 'svc_123',
        }),
      }),
      body: jsonContentRequired(ServiceConditionInputSchema, 'Service condition creation payload'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(ServiceConditionSchema),
        'Service condition created successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Service not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  update_condition: createRoute({
    method: 'patch',
    tags: [API_TAGS.SERVICE],
    path: '/{serviceId}/conditions/{conditionId}',
    summary: 'Update a condition on a service',
    description: 'Update a specific condition belonging to a service owned by the authenticated clinic or standalone doctor.',
    request: {
      params: z.object({
        serviceId: z.string().openapi({
          param: { name: 'serviceId', in: 'path' },
          description: 'Service identifier',
          example: 'svc_123',
        }),
        conditionId: z.string().openapi({
          param: { name: 'conditionId', in: 'path' },
          description: 'Condition identifier',
          example: 'cond_456',
        }),
      }),
      body: jsonContentRequired(
        ServiceConditionInputSchema.partial(),
        'Service condition update payload'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(ServiceConditionSchema),
        'Service condition updated successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Service or condition not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  delete_condition: createRoute({
    method: 'delete',
    tags: [API_TAGS.SERVICE],
    path: '/{serviceId}/conditions/{conditionId}',
    summary: 'Delete a condition from a service',
    description: 'Remove a specific condition from a service owned by the authenticated clinic or standalone doctor.',
    request: {
      params: z.object({
        serviceId: z.string().openapi({
          param: { name: 'serviceId', in: 'path' },
          description: 'Service identifier',
          example: 'svc_123',
        }),
        conditionId: z.string().openapi({
          param: { name: 'conditionId', in: 'path' },
          description: 'Condition identifier',
          example: 'cond_456',
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(ServiceConditionSchema),
        'Service condition deleted successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Service or condition not found'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),
} as const

