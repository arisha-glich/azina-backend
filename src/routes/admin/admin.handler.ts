import { hashPassword } from 'better-auth/crypto'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import {
  checkPermission,
  getUserPermissions,
  isAdminRole,
  isSystemRole,
  userHasPermission,
} from '~/lib/auth-permissions'
import { emailHelpers } from '~/lib/email/service'
import { convertImagesToSignedUrls } from '~/lib/image-url-converter'
import prisma from '~/lib/prisma'
import type { ADMIN_ROUTES } from '~/routes/admin/admin.routes'
import { approvalService } from '~/services/approval.service'
import type { HandlerMapFromRoutes } from '~/types'

export const ADMIN_ROUTE_HANDLER: HandlerMapFromRoutes<typeof ADMIN_ROUTES> = {
  get_all_requests: async c => {
    try {
      const user = c.get('user')
      if (!user) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Check if user is admin (case-insensitive)
      if (!isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const status = c.req.query('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined

      const requests = status
        ? await approvalService.getAllRequests(status)
        : await approvalService.getAllPendingRequests()

      // Convert image URLs to signed URLs
      const processedRequests = await convertImagesToSignedUrls(requests)

      return c.json(
        {
          message: 'Requests retrieved successfully',
          success: true,
          data: processedRequests,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving requests:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_request_by_id: async c => {
    try {
      const user = c.get('user')
      if (!user) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }
      if (!isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { id } = c.req.valid('param')
      const request = await approvalService.getRequestById(id)
      if (!request) {
        return c.json({ message: 'Request not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Convert image URLs to signed URLs
      const processedRequest = await convertImagesToSignedUrls(request)

      return c.json(
        {
          message: 'Request retrieved successfully',
          success: true,
          data: processedRequest,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving request by id:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  approve_request: async c => {
    try {
      const user = c.get('user')
      if (!user) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Check if user is admin
      if (!isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { requestId } = c.req.valid('json')
      const approvedRequest = await approvalService.approveRequest(requestId, user.id)

      if (!approvedRequest) {
        return c.json({ message: 'Request not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Send approval email based on request type
      const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`

      try {
        if (approvedRequest.request_type === 'DOCTOR' && approvedRequest.entity?.user) {
          const doctorName = approvedRequest.entity.user.name || approvedRequest.entity.user.email
          await emailHelpers.sendPractitionerAccountApproved(approvedRequest.entity.user.email, {
            practitionerName: doctorName,
            loginLink,
          })
        } else if (approvedRequest.request_type === 'CLINIC' && approvedRequest.user) {
          // For clinic, entity is the clinic object, user is the clinic owner
          const clinicName = approvedRequest.entity?.clinic_name || approvedRequest.user.name || approvedRequest.user.email
          await emailHelpers.sendClinicAccountApproved(approvedRequest.user.email, {
            clinicName,
            loginLink,
          })
        }
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error('Error sending approval email:', emailError)
      }

      return c.json(
        {
          message: 'Request approved successfully',
          success: true,
          data: approvedRequest,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error approving request:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  reject_request: async c => {
    try {
      const user = c.get('user')
      if (!user) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Check if user is admin
      if (!isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { requestId, rejectionReason } = c.req.valid('json')
      const rejectedRequest = await approvalService.rejectRequest(
        requestId,
        user.id,
        rejectionReason
      )

      if (!rejectedRequest) {
        return c.json({ message: 'Request not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'Request rejected successfully',
          success: true,
          data: rejectedRequest,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error rejecting request:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  // Role Management Handlers
  get_roles: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      })

      return c.json(
        {
          message: 'Roles retrieved successfully',
          success: true,
          data: roles,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving roles:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  create_role: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { name, displayName, description, permissionIds } = c.req.valid('json')

      if (!name || !displayName) {
        return c.json(
          { message: 'Name and display name are required', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      // Check if role name already exists
      const existingRole = await prisma.role.findUnique({
        where: { name: name.toUpperCase() },
      })

      if (existingRole) {
        return c.json(
          { message: 'Role with this name already exists', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      // Prevent creating system roles
      if (isSystemRole(name)) {
        return c.json(
          { message: 'Cannot create system roles', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      // Validate permission IDs if provided
      if (permissionIds && permissionIds.length > 0) {
        const existingPermissions = await prisma.permission.findMany({
          where: {
            id: {
              in: permissionIds,
            },
          },
          select: {
            id: true,
          },
        })

        const existingPermissionIds = existingPermissions.map(p => p.id)
        const invalidPermissionIds = permissionIds.filter(
          (id: string) => !existingPermissionIds.includes(id)
        )

        if (invalidPermissionIds.length > 0) {
          return c.json(
            {
              message: 'Some permission IDs do not exist. Please seed permissions first.',
              success: false,
              invalidPermissionIds,
              hint: 'Run POST /api/v1/admin/permissions/seed to create all permissions',
            },
            HttpStatusCodes.BAD_REQUEST
          )
        }
      }

      // Create role with permissions
      const role = await prisma.role.create({
        data: {
          name: name.toUpperCase(),
          displayName,
          description,
          isSystem: false,
          permissions: {
            create:
              permissionIds?.map((permissionId: string) => ({
                permissionId,
              })) || [],
          },
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })

      return c.json(
        {
          message: 'Role created successfully',
          success: true,
          data: role,
        },
        HttpStatusCodes.CREATED
      )
    } catch (error) {
      console.error('Error creating role:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_role: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { id } = c.req.valid('param')
      const { displayName, description, permissionIds } = c.req.valid('json')

      // Check if role exists
      const existingRole = await prisma.role.findUnique({
        where: { id },
      })

      if (!existingRole) {
        return c.json({ message: 'Role not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Prevent updating system roles
      if (existingRole.isSystem) {
        return c.json(
          { message: 'Cannot update system roles', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      // Update role
      const role = await prisma.role.update({
        where: { id },
        data: {
          displayName,
          description,
          ...(permissionIds && {
            permissions: {
              deleteMany: {},
              create: permissionIds.map((permissionId: string) => ({
                permissionId,
              })),
            },
          }),
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })

      return c.json(
        {
          message: 'Role updated successfully',
          success: true,
          data: role,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating role:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  delete_role: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { id } = c.req.valid('param')

      // Check if role exists
      const existingRole = await prisma.role.findUnique({
        where: { id },
      })

      if (!existingRole) {
        return c.json({ message: 'Role not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Prevent deleting system roles
      if (existingRole.isSystem) {
        return c.json(
          { message: 'Cannot delete system role', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      // Delete role (cascade will handle role_permission and user.roleId)
      await prisma.role.delete({
        where: { id },
      })

      return c.json(
        {
          message: 'Role deleted successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error deleting role:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  // Permission Management Handlers
  get_permissions: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const resource = c.req.query('resource')
      const grouped = c.req.query('grouped') === 'true'

      const where = resource ? { resource } : {}

      const permissions = await prisma.permission.findMany({
        where,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      })

      // If grouped=true, return permissions grouped by resource
      if (grouped) {
        const groupedPermissions: Record<
          string,
          Array<{
            id: string
            action: string
            description: string | null
            createdAt: Date
            updatedAt: Date
          }>
        > = {}

        permissions.forEach(permission => {
          if (!groupedPermissions[permission.resource]) {
            groupedPermissions[permission.resource] = []
          }
          groupedPermissions[permission.resource].push({
            id: permission.id,
            action: permission.action,
            description: permission.description,
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt,
          })
        })

        return c.json(
          {
            message: 'Permissions retrieved successfully',
            success: true,
            data: groupedPermissions,
          },
          HttpStatusCodes.OK
        )
      }

      // Default: return flat array
      return c.json(
        {
          message: 'Permissions retrieved successfully',
          success: true,
          data: permissions,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving permissions:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  // User Role Assignment Handlers
  assign_role: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { userId } = c.req.valid('param')
      const { roleId } = c.req.valid('json')

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!targetUser) {
        return c.json({ message: 'User not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!role) {
        return c.json({ message: 'Role not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Assign role to user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          roleId,
        },
        include: {
          dynamicRole: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      })

      return c.json(
        {
          message: 'Role assigned successfully',
          success: true,
          data: {
            id: updatedUser.id,
            roleId: updatedUser.roleId,
            dynamicRole: updatedUser.dynamicRole,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error assigning role:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  revoke_role: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { userId } = c.req.valid('param')

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!targetUser) {
        return c.json({ message: 'User not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Revoke role from user
      await prisma.user.update({
        where: { id: userId },
        data: {
          roleId: null,
        },
      })

      return c.json(
        {
          message: 'Role revoked successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error revoking role:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  // Permission Check Handler
  check_permission: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { userId, role: roleName, resource, action } = c.req.valid('query')

      if (!resource || !action) {
        return c.json(
          { message: 'Resource and action are required', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      let hasPermission = false

      if (userId) {
        hasPermission = await checkPermission(userId, resource, action)
      } else if (roleName) {
        hasPermission = await userHasPermission({
          role: roleName,
          permissions: {
            [resource]: [action],
          },
        })
      }

      return c.json(
        {
          hasPermission,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error checking permission:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  // Get User Permissions Handler
  get_user_permissions: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { userId } = c.req.valid('param')

      // Get user with role information
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          dynamicRole: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      })

      if (!targetUser) {
        return c.json({ message: 'User not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Get user permissions
      const permissions = await getUserPermissions(userId)

      return c.json(
        {
          message: 'Permissions retrieved successfully',
          success: true,
          data: {
            userId: targetUser.id,
            role: targetUser.role,
            dynamicRole: targetUser.dynamicRole,
            permissions,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving user permissions:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  // Seed Permissions Handler
  seed_permissions: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      // All permissions based on auth-permissions.ts statement configuration
      const permissionsToSeed = [
        // User permissions
        { resource: 'user', action: 'create', description: 'Create new users' },
        { resource: 'user', action: 'update', description: 'Update user information' },
        { resource: 'user', action: 'delete', description: 'Delete users' },
        { resource: 'user', action: 'ban', description: 'Ban users' },
        { resource: 'user', action: 'unban', description: 'Unban users' },
        { resource: 'user', action: 'view', description: 'View user details' },
        { resource: 'user', action: 'list', description: 'List all users' },

        // Organization permissions
        { resource: 'organization', action: 'create', description: 'Create organizations' },
        { resource: 'organization', action: 'update', description: 'Update organizations' },
        { resource: 'organization', action: 'delete', description: 'Delete organizations' },
        { resource: 'organization', action: 'view', description: 'View organization details' },
        { resource: 'organization', action: 'list', description: 'List all organizations' },
        { resource: 'organization', action: 'manage', description: 'Manage organizations' },

        // Approval Request permissions
        { resource: 'approval_request', action: 'create', description: 'Create approval requests' },
        { resource: 'approval_request', action: 'update', description: 'Update approval requests' },
        { resource: 'approval_request', action: 'delete', description: 'Delete approval requests' },
        {
          resource: 'approval_request',
          action: 'view',
          description: 'View approval request details',
        },
        { resource: 'approval_request', action: 'list', description: 'List all approval requests' },
        { resource: 'approval_request', action: 'manage', description: 'Manage approval requests' },

        // Permission permissions
        { resource: 'permission', action: 'create', description: 'Create permissions' },
        { resource: 'permission', action: 'update', description: 'Update permissions' },
        { resource: 'permission', action: 'delete', description: 'Delete permissions' },
        { resource: 'permission', action: 'view', description: 'View permission details' },
        { resource: 'permission', action: 'list', description: 'List all permissions' },
        { resource: 'permission', action: 'assign', description: 'Assign permissions to roles' },
        { resource: 'permission', action: 'revoke', description: 'Revoke permissions from roles' },

        // Subscription permissions
        { resource: 'subscription', action: 'create', description: 'Create subscriptions' },
        { resource: 'subscription', action: 'update', description: 'Update subscriptions' },
        { resource: 'subscription', action: 'delete', description: 'Delete subscriptions' },
        { resource: 'subscription', action: 'view', description: 'View subscription details' },
        { resource: 'subscription', action: 'list', description: 'List all subscriptions' },
        { resource: 'subscription', action: 'manage', description: 'Manage subscriptions' },

        // Receive Payment permissions
        {
          resource: 'recieve_payment',
          action: 'create',
          description: 'Create receive payment records',
        },
        {
          resource: 'recieve_payment',
          action: 'update',
          description: 'Update receive payment records',
        },
        {
          resource: 'recieve_payment',
          action: 'delete',
          description: 'Delete receive payment records',
        },
        {
          resource: 'recieve_payment',
          action: 'view',
          description: 'View receive payment details',
        },
        { resource: 'recieve_payment', action: 'list', description: 'List all receive payments' },
        { resource: 'recieve_payment', action: 'manage', description: 'Manage receive payments' },

        // Reviews permissions
        { resource: 'reviews', action: 'create', description: 'Create reviews' },
        { resource: 'reviews', action: 'update', description: 'Update reviews' },
        { resource: 'reviews', action: 'delete', description: 'Delete reviews' },
        { resource: 'reviews', action: 'view', description: 'View review details' },
        { resource: 'reviews', action: 'list', description: 'List all reviews' },
        { resource: 'reviews', action: 'manage', description: 'Manage reviews' },

        // User Query permissions
        { resource: 'user_query', action: 'create', description: 'Create user queries' },
        { resource: 'user_query', action: 'update', description: 'Update user queries' },
        { resource: 'user_query', action: 'delete', description: 'Delete user queries' },
        { resource: 'user_query', action: 'view', description: 'View user query details' },
        { resource: 'user_query', action: 'list', description: 'List all user queries' },
        { resource: 'user_query', action: 'manage', description: 'Manage user queries' },

        // Role permissions
        { resource: 'role', action: 'create', description: 'Create roles' },
        { resource: 'role', action: 'update', description: 'Update roles' },
        { resource: 'role', action: 'delete', description: 'Delete roles' },
        { resource: 'role', action: 'assign', description: 'Assign roles to users' },
        { resource: 'role', action: 'revoke', description: 'Revoke roles from users' },
        { resource: 'role', action: 'view', description: 'View role details' },
        { resource: 'role', action: 'list', description: 'List all roles' },

        // Appointment permissions (from admin role)
        { resource: 'appointment', action: 'create', description: 'Create appointments' },
        { resource: 'appointment', action: 'update', description: 'Update appointments' },
        { resource: 'appointment', action: 'delete', description: 'Delete appointments' },
        { resource: 'appointment', action: 'view', description: 'View appointment details' },
        { resource: 'appointment', action: 'list', description: 'List all appointments' },
        { resource: 'appointment', action: 'manage', description: 'Manage appointments' },

        // Invoice permissions (from admin role)
        { resource: 'invoice', action: 'create', description: 'Create invoices' },
        { resource: 'invoice', action: 'update', description: 'Update invoices' },
        { resource: 'invoice', action: 'delete', description: 'Delete invoices' },
        { resource: 'invoice', action: 'view', description: 'View invoice details' },
        { resource: 'invoice', action: 'list', description: 'List all invoices' },
        { resource: 'invoice', action: 'approve', description: 'Approve invoices' },
        { resource: 'invoice', action: 'pay', description: 'Pay invoices' },

        // Report permissions (from admin role)
        { resource: 'report', action: 'create', description: 'Create reports' },
        { resource: 'report', action: 'update', description: 'Update reports' },
        { resource: 'report', action: 'delete', description: 'Delete reports' },
        { resource: 'report', action: 'view', description: 'View report details' },
        { resource: 'report', action: 'list', description: 'List all reports' },
        { resource: 'report', action: 'export', description: 'Export reports' },

        // Settings permissions
        { resource: 'settings', action: 'view', description: 'View settings' },
        { resource: 'settings', action: 'update', description: 'Update settings' },
      ]

      let created = 0
      let skipped = 0
      const createdPermissions: Array<{
        id: string
        resource: string
        action: string
        description: string | null
      }> = []

      for (const perm of permissionsToSeed) {
        try {
          const permission = await prisma.permission.create({
            data: perm,
          })
          createdPermissions.push({
            id: permission.id,
            resource: permission.resource,
            action: permission.action,
            description: permission.description,
          })
          created++
          // biome-ignore lint/suspicious/noExplicitAny: Prisma error types are dynamic
        } catch (error: any) {
          // Check if error is due to unique constraint (permission already exists)
          if (error.code === 'P2002') {
            // Permission already exists, fetch it
            const existing = await prisma.permission.findUnique({
              where: {
                resource_action: {
                  resource: perm.resource,
                  action: perm.action,
                },
              },
            })
            if (existing) {
              createdPermissions.push({
                id: existing.id,
                resource: existing.resource,
                action: existing.action,
                description: existing.description,
              })
            }
            skipped++
          } else {
            throw error
          }
        }
      }

      return c.json(
        {
          message: 'Permissions seeded successfully',
          success: true,
          data: {
            created,
            skipped,
            total: permissionsToSeed.length,
            permissions: createdPermissions,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error seeding permissions:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  // Team Member Management Handler
  get_team_members: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const teamMembers = await prisma.user.findMany({
        where: {
          onboarding_stage: 'admin-role',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleId: true,
          onboarding_stage: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          dynamicRole: {
            select: {
              id: true,
              name: true,
              displayName: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Transform to match the response schema (roleDetail instead of dynamicRole)
      const transformedTeamMembers = teamMembers.map(member => ({
        ...member,
        roleDetail: member.dynamicRole,
      }))

      // Convert image URLs to signed URLs
      const processedTeamMembers = await convertImagesToSignedUrls(transformedTeamMembers)

      return c.json(
        {
          message: 'Team members retrieved successfully',
          success: true,
          data: processedTeamMembers,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving team members:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  create_team_member: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const { name, email, password, roleId } = c.req.valid('json')

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      })

      if (!role) {
        return c.json({ message: 'Role not found', success: false }, HttpStatusCodes.BAD_REQUEST)
      }

      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return c.json(
          { message: 'User with this email already exists', success: false },
          HttpStatusCodes.CONFLICT
        )
      }

      // Hash password using better-auth crypto
      const hashedPassword = await hashPassword(password)

      // Create user directly with Prisma
      const createdUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          emailVerified: false,
          roleId,
          onboarding_stage: 'admin-role',
          role: 'user', // Default system role, will be overridden by dynamic role
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleId: true,
          onboarding_stage: true,
        },
      })

      // Send credentials email
      const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
      await emailHelpers.sendAdminTeamMemberCredentials(email, {
        name: name || email,
        email,
        password, // Send plain password as requested
        roleName: role.displayName || role.name,
        loginLink,
      })

      return c.json(
        {
          message: 'Team member created successfully',
          success: true,
          data: createdUser,
        },
        HttpStatusCodes.CREATED
      )
      // biome-ignore lint/suspicious/noExplicitAny: Prisma error types are dynamic
    } catch (error: any) {
      console.error('Error creating team member:', error)

      // Handle unique constraint violation (email already exists)
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return c.json(
          { message: 'User with this email already exists', success: false },
          HttpStatusCodes.CONFLICT
        )
      }

      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  // Admin Profile Management Handler
  update_admin_profile: async c => {
    try {
      const user = c.get('user')
      if (!user || !isAdminRole(user.role)) {
        return c.json(
          { message: 'Forbidden - Admin role required', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      const updateData = c.req.valid('json')
      const userId = user.id

      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email },
        })

        if (existingUser) {
          return c.json(
            { message: 'Email already exists', success: false },
            HttpStatusCodes.CONFLICT
          )
        }
      }

      // Prepare update data (only include fields that are provided)
      const updateFields: {
        name?: string
        email?: string
        image?: string | null
      } = {}

      if (updateData.name !== undefined) {
        updateFields.name = updateData.name
      }
      if (updateData.email !== undefined) {
        updateFields.email = updateData.email
      }
      if (updateData.image !== undefined) {
        updateFields.image = updateData.image
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateFields,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          emailVerified: true,
          role: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return c.json(
        {
          message: 'Profile updated successfully',
          success: true,
          data: updatedUser,
        },
        HttpStatusCodes.OK
      )
      // biome-ignore lint/suspicious/noExplicitAny: Prisma error types are dynamic
    } catch (error: any) {
      console.error('Error updating admin profile:', error)

      // Handle unique constraint violation (email already exists)
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return c.json({ message: 'Email already exists', success: false }, HttpStatusCodes.CONFLICT)
      }

      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}
