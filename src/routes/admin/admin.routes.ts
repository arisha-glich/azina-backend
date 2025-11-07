import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'

const ApprovalRequestSchema = z.object({
  id: z.string(),
  request_type: z.string(), // 'DOCTOR' | 'CLINIC'
  user_id: z.string(),
  entity_id: z.string(),
  status: z.string(), // 'PENDING' | 'APPROVED' | 'REJECTED'
  rejection_reason: z.string().nullable(),
  reviewed_by: z.string().nullable(),
  reviewed_at: z.date().nullable(),
  request_data: z.any().nullable().openapi({
    description: 'Request data (JSON object)',
    type: 'object',
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    role: z.string(),
    onboarding_stage: z.string().nullable(),
  }),
  entity: z.any().nullable().openapi({
    description: 'Entity data (Doctor or Clinic object)',
    type: 'object',
  }), // Full doctor/clinic object
})

const ApprovalRequestUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  role: z.string(),
  onboarding_stage: z.string().nullable(),
  image: z.string().nullable().optional(),
  phone_no: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  dob: z.date().nullable().optional(),
  banned: z.boolean().optional(),
  banReason: z.string().nullable().optional(),
  banExpiresAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const ApprovalRequestWithUserSchema = ApprovalRequestSchema.extend({
  user: ApprovalRequestUserSchema,
})

const ApproveRequestSchema = z.object({
  requestId: z.string(),
})

const RejectRequestSchema = z.object({
  requestId: z.string(),
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
})

export const ADMIN_ROUTES = {
  get_all_requests: createRoute({
    method: 'get',
    tags: [API_TAGS.ADMIN],
    path: '/requests',
    summary: 'Get all approval requests',
    description: 'Get all approval requests (admin only). Can filter by status',
    request: {
      query: z.object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.array(ApprovalRequestSchema),
        }),
        'Requests retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Forbidden - Admin role required'
      ),
    },
  }),

  get_request_by_id: createRoute({
    method: 'get',
    tags: [API_TAGS.ADMIN],
    path: '/requests/{id}',
    summary: 'Get a specific approval request by ID',
    description: 'Fetch a single approval request with expanded user details',
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: ApprovalRequestWithUserSchema,
        }),
        'Request retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Request not found'
      ),
    },
  }),

  approve_request: createRoute({
    method: 'patch',
    tags: [API_TAGS.ADMIN],
    path: '/requests/approve',
    summary: 'Approve an approval request',
    description: 'Approve a pending approval request (admin only)',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ApproveRequestSchema,
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: ApprovalRequestSchema,
        }),
        'Request approved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Forbidden - Admin role required'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Request not found'
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

  reject_request: createRoute({
    method: 'patch',
    tags: [API_TAGS.ADMIN],
    path: '/requests/reject',
    summary: 'Reject an approval request',
    description: 'Reject a pending approval request with a reason (admin only)',
    request: {
      body: {
        content: {
          'application/json': {
            schema: RejectRequestSchema,
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: ApprovalRequestSchema,
        }),
        'Request rejected successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
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

  // Role Management Routes
  get_roles: createRoute({
    method: 'get',
    tags: [API_TAGS.ADMIN],
    path: '/roles',
    summary: 'Get all roles',
    description: 'Get all roles (system and custom). Admin only.',
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              displayName: z.string(),
              description: z.string().nullable(),
              isSystem: z.boolean(),
              createdAt: z.date(),
              updatedAt: z.date(),
              permissions: z.array(
                z.object({
                  id: z.string(),
                  permission: z.object({
                    id: z.string(),
                    resource: z.string(),
                    action: z.string(),
                    description: z.string().nullable(),
                  }),
                })
              ),
              _count: z.object({
                users: z.number(),
              }),
            })
          ),
        }),
        'Roles retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
    },
  }),

  create_role: createRoute({
    method: 'post',
    tags: [API_TAGS.ADMIN],
    path: '/roles',
    summary: 'Create a new role',
    description: 'Create a new custom role with permissions. Admin only.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().min(1, 'Role name is required'),
              displayName: z.string().min(1, 'Display name is required'),
              description: z.string().optional(),
              permissionIds: z.array(z.string()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            id: z.string(),
            name: z.string(),
            displayName: z.string(),
            description: z.string().nullable(),
            isSystem: z.boolean(),
            permissions: z.array(
              z.object({
                id: z.string(),
                permission: z.object({
                  id: z.string(),
                  resource: z.string(),
                  action: z.string(),
                }),
              })
            ),
          }),
        }),
        'Role created successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Bad request'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
    },
  }),

  update_role: createRoute({
    method: 'patch',
    tags: [API_TAGS.ADMIN],
    path: '/roles/{id}',
    summary: 'Update a role',
    description: 'Update role details and permissions. Cannot update system roles. Admin only.',
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              displayName: z.string().optional(),
              description: z.string().optional(),
              permissionIds: z.array(z.string()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            id: z.string(),
            name: z.string(),
            displayName: z.string(),
            description: z.string().nullable(),
            permissions: z.array(
              z.object({
                id: z.string(),
                permission: z.object({
                  id: z.string(),
                  resource: z.string(),
                  action: z.string(),
                }),
              })
            ),
          }),
        }),
        'Role updated successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Bad request'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Role not found'
      ),
    },
  }),

  delete_role: createRoute({
    method: 'delete',
    tags: [API_TAGS.ADMIN],
    path: '/roles/{id}',
    summary: 'Delete a role',
    description: 'Delete a custom role. Cannot delete system roles. Admin only.',
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Role deleted successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Cannot delete system role'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Role not found'
      ),
    },
  }),

  // Permission Management Routes
  get_permissions: createRoute({
    method: 'get',
    tags: [API_TAGS.ADMIN],
    path: '/permissions',
    summary: 'Get all permissions',
    description: 'Get all available permissions. Can be grouped by resource. Admin only.',
    request: {
      query: z.object({
        resource: z.string().optional(),
        grouped: z.enum(['true', 'false']).optional().default('false'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.union([
          // Flat array format (default)
          z.object({
            message: z.string(),
            success: z.boolean(),
            data: z.array(
              z.object({
                id: z.string(),
                resource: z.string(),
                action: z.string(),
                description: z.string().nullable(),
                createdAt: z.date(),
                updatedAt: z.date(),
              })
            ),
          }),
          // Grouped by resource format
          z.object({
            message: z.string(),
            success: z.boolean(),
            data: z.record(
              z.string(), // resource name
              z.array(
                z.object({
                  id: z.string(),
                  action: z.string(),
                  description: z.string().nullable(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                })
              )
            ),
          }),
        ]),
        'Permissions retrieved successfully'
      ),
    },
  }),

  create_permission: createRoute({
    method: 'post',
    tags: [API_TAGS.ADMIN],
    path: '/permissions',
    summary: 'Create a new permission',
    description: 'Create a new permission. Admin only.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              resource: z.string().min(1, 'Resource is required'),
              action: z.string().min(1, 'Action is required'),
              description: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            id: z.string(),
            resource: z.string(),
            action: z.string(),
            description: z.string().nullable(),
          }),
        }),
        'Permission created successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Permission already exists'
      ),
    },
  }),

  // User Role Assignment Routes
  assign_role: createRoute({
    method: 'post',
    tags: [API_TAGS.ADMIN],
    path: '/users/{userId}/assign-role',
    summary: 'Assign a role to a user',
    description: 'Assign a custom role to a user. Admin only.',
    request: {
      params: z.object({ userId: z.string() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              roleId: z.string().min(1, 'Role ID is required'),
            }),
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            id: z.string(),
            roleId: z.string().nullable(),
            dynamicRole: z
              .object({
              id: z.string(),
              name: z.string(),
              displayName: z.string(),
              })
              .nullable(),
          }),
        }),
        'Role assigned successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'User or role not found'
      ),
    },
  }),

  revoke_role: createRoute({
    method: 'delete',
    tags: [API_TAGS.ADMIN],
    path: '/users/{userId}/revoke-role',
    summary: 'Revoke a role from a user',
    description: 'Remove a custom role from a user. Admin only.',
    request: {
      params: z.object({ userId: z.string() }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Role revoked successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'User not found'
      ),
    },
  }),

  // Permission Check Routes
  check_permission: createRoute({
    method: 'get',
    tags: [API_TAGS.ADMIN],
    path: '/check-permission',
    summary: 'Check if user has permission',
    description: 'Check if a user has specific permissions. Admin only.',
    request: {
      query: z.object({
        userId: z.string().optional(),
        role: z.string().optional(),
        resource: z.string(),
        action: z.string(),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          hasPermission: z.boolean(),
        }),
        'Permission check result'
      ),
    },
  }),

  // Get User Permissions
  get_user_permissions: createRoute({
    method: 'get',
    tags: [API_TAGS.ADMIN],
    path: '/users/{userId}/permissions',
    summary: 'Get user permissions',
    description: 'Get all permissions for a specific user. Admin only.',
    request: {
      params: z.object({ userId: z.string() }),
    },
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
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'User not found'
      ),
    },
  }),

  // Seed Permissions Endpoint
  seed_permissions: createRoute({
    method: 'post',
    tags: [API_TAGS.ADMIN],
    path: '/permissions/seed',
    summary: 'Seed all permissions',
    description:
      'Create all default permissions in the database. Admin only. Safe to run multiple times (skips existing permissions).',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            created: z.number(),
            skipped: z.number(),
            total: z.number(),
            permissions: z.array(
              z.object({
                id: z.string(),
                resource: z.string(),
                action: z.string(),
                description: z.string().nullable(),
              })
            ),
          }),
        }),
        'Permissions seeded successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
    },
  }),

  // Team Member Management
  get_team_members: createRoute({
    method: 'get',
    tags: [API_TAGS.ADMIN],
    path: '/team-members',
    summary: 'Get all team members',
    description: 'Get all team members (users with admin-role onboarding stage). Admin only.',
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.array(
            z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              role: z.string(),
              roleId: z.string().nullable(),
              onboarding_stage: z.string().nullable(),
              emailVerified: z.boolean(),
              createdAt: z.date(),
              updatedAt: z.date(),
              roleDetail: z
                .object({
                  id: z.string(),
                  name: z.string(),
                  displayName: z.string(),
                  description: z.string().nullable(),
                })
                .nullable(),
            })
          ),
        }),
        'Team members retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
    },
  }),

  create_team_member: createRoute({
    method: 'post',
    tags: [API_TAGS.ADMIN],
    path: '/team-members',
    summary: 'Create a new team member',
    description:
      'Create a new team member with name, email, password, and assign a role. Admin only.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().min(1, 'Name is required'),
              email: z.string().email('Valid email is required'),
              password: z.string().min(8, 'Password must be at least 8 characters'),
              roleId: z.string().min(1, 'Role ID is required'),
            }),
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
            role: z.string(),
            roleId: z.string().nullable(),
            onboarding_stage: z.string().nullable(),
          }),
        }),
        'Team member created successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Bad request'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
      [HttpStatusCodes.CONFLICT]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'User with this email already exists'
      ),
    },
  }),

  // Admin Profile Management
  update_admin_profile: createRoute({
    method: 'patch',
    tags: [API_TAGS.ADMIN],
    path: '/profile',
    summary: 'Update admin profile',
    description: 'Update admin profile information (name, email, profile image). Admin only.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().min(1, 'Name is required').optional(),
              email: z.string().email('Valid email is required').optional(),
              image: z.string().url('Valid image URL is required').nullable().optional(),
            }),
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
            image: z.string().nullable(),
            emailVerified: z.boolean(),
            role: z.string(),
            roleId: z.string().nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        }),
        'Profile updated successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Bad request'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Forbidden - Admin role required'
      ),
      [HttpStatusCodes.CONFLICT]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Email already exists'
      ),
    },
  }),
}
