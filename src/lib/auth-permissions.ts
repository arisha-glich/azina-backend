import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'
import prisma from '~/lib/prisma'

/**
 * System roles that cannot be deleted or modified
 */
export const SYSTEM_ROLES = ['ADMIN', 'DOCTOR', 'PATIENT', 'CLINIC'] as const
export type SystemRole = (typeof SYSTEM_ROLES)[number]
export function isAdminRole(role?: string | null): boolean {
  if (!role) {
    return false
  }
  return role.trim().toUpperCase() === 'ADMIN'
}

/**
 * Check if a role is clinic (case-insensitive)
 */
export function isClinicRole(role?: string | null): boolean {
  if (!role) {
    return false
  }
  return role.trim().toUpperCase() === 'CLINIC'
}

/**
 * Check if a role is a system role
 */
export function isSystemRole(role: string): boolean {
  return SYSTEM_ROLES.includes(role.trim().toUpperCase() as SystemRole)
}

const statement = {
  ...defaultStatements,
  user: ['create', 'update', 'delete', 'ban', 'unban', 'view', 'list'],
  organization: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  approval_request: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  permission: ['create', 'update', 'delete', 'view', 'list', 'assign', 'revoke'],
  subscription: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  recieve_payment: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  reviews: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  user_query: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  role: ['create', 'update', 'delete', 'assign', 'revoke', 'view', 'list'],
  appointment: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  invoice: ['create', 'update', 'delete', 'view', 'list', 'approve', 'pay'],
  report: ['create', 'update', 'delete', 'view', 'list', 'export'],
  settings: ['view', 'update'],
} as const

/**
 * Create access control instance
 */
export const ac = createAccessControl(statement)

/**
 * Admin role with full permissions
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  user: ['create', 'update', 'delete', 'ban', 'unban', 'view', 'list'],
  organization: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  approval_request: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  permission: ['create', 'update', 'delete', 'view', 'list', 'assign', 'revoke'],
  subscription: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  recieve_payment: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  reviews: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  user_query: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  role: ['create', 'update', 'delete', 'assign', 'revoke', 'view', 'list'],
  appointment: ['create', 'update', 'delete', 'view', 'list', 'manage'],
  invoice: ['create', 'update', 'delete', 'view', 'list', 'approve', 'pay'],
  report: ['create', 'update', 'delete', 'view', 'list', 'export'],
  settings: ['view', 'update'],
})

/**
 * Regular user role with limited permissions
 */
export const user = ac.newRole({
  user: ['view'],
  organization: ['view'],
})

/**
 * Clinic role
 */
export const clinic = ac.newRole({
  user: ['view', 'list'],
  organization: ['view', 'manage'],
})

/**
 * Doctor role
 */
export const doctor = ac.newRole({
  user: ['view'],
  organization: ['view'],
})

/**
 * Patient role
 */
export const patient = ac.newRole({
  user: ['view', 'update'],
  organization: ['view'],
})

/**
 * Helper function to check user permissions dynamically
 */
export async function checkPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    // Get user with their dynamic role and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dynamicRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return false
    }

    // Check if user has admin role (case-insensitive: ADMIN, Admin, admin all work)
    // Admins have all permissions automatically
    if (isAdminRole(user.role)) {
      return true
    }

    // Check system roles first
    if (user.role && isSystemRole(user.role)) {
      const systemRole = user.role.toUpperCase()
      const roleConfig = {
        ADMIN: admin,
        CLINIC: clinic,
        DOCTOR: doctor,
        PATIENT: patient,
      }[systemRole]

      if (roleConfig) {
        const permissions = (roleConfig.statements as Record<string, readonly string[]>)[resource]
        // biome-ignore lint/suspicious/noExplicitAny: Action type needs to match permission string arrays
        return permissions?.includes(action as any) || false
      }
    }

    // Check dynamic role permissions
    if (user.dynamicRole) {
      const hasPermission = user.dynamicRole.permissions.some(
        rp => rp.permission.resource === resource && rp.permission.action === action
      )
      return hasPermission
    }

    return false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Helper to get all permissions for a user
 */
export async function getUserPermissions(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dynamicRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return []
    }

    // If admin (case-insensitive: ADMIN, Admin, admin), return all permissions
    // from admin role definition - includes all resources and actions
    if (isAdminRole(user.role)) {
      return Object.entries(admin.statements).flatMap(([resource, actions]) =>
        (actions as string[]).map(action => ({ resource, action }))
      )
    }

    // Get system role permissions
    let permissions: Array<{ resource: string; action: string }> = []

    if (user.role && isSystemRole(user.role)) {
      const systemRole = user.role.toUpperCase()
      const roleConfig = {
        CLINIC: clinic,
        DOCTOR: doctor,
        PATIENT: patient,
      }[systemRole]

      if (roleConfig) {
        permissions = Object.entries(roleConfig.statements).flatMap(([resource, actions]) =>
          (actions as string[]).map(action => ({ resource, action }))
        )
      }
    }

    // Add dynamic role permissions
    if (user.dynamicRole) {
      const dynamicPermissions = user.dynamicRole.permissions.map(rp => ({
        resource: rp.permission.resource,
        action: rp.permission.action,
      }))
      permissions = [...permissions, ...dynamicPermissions]
    }

    // Remove duplicates
    return Array.from(new Set(permissions.map(p => JSON.stringify(p)))).map(p => JSON.parse(p))
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

/**
 * Check if a user has permission (similar to better-auth's userHasPermission)
 * Supports checking multiple resource permissions at once
 */
export async function userHasPermission(params: {
  userId?: string
  role?: string
  permissions: Record<string, string[]>
}): Promise<boolean> {
  try {
    const { userId, role: roleName, permissions } = params

    // If checking by role name directly
    if (roleName) {
      const upperRole = roleName.toUpperCase()

      // Check system roles
      if (isSystemRole(upperRole)) {
        const roleConfig = {
          ADMIN: admin,
          CLINIC: clinic,
          DOCTOR: doctor,
          PATIENT: patient,
        }[upperRole]

        if (roleConfig) {
          // Check all required permissions
          for (const [resource, actions] of Object.entries(permissions)) {
            const rolePermissions = (roleConfig.statements as Record<string, readonly string[]>)[
              resource
            ]
            if (!rolePermissions) {
              return false
            }

            for (const action of actions) {
              // biome-ignore lint/suspicious/noExplicitAny: Action type needs to match permission string arrays
              if (!rolePermissions.includes(action as any)) {
                return false
              }
            }
          }
          return true
        }
      }

      // Check dynamic role from database
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            dynamicRole: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        })

        if (user?.dynamicRole?.name.toUpperCase() === upperRole) {
          // Check all required permissions
          for (const [resource, actions] of Object.entries(permissions)) {
            for (const action of actions) {
              const hasPermission = user.dynamicRole.permissions.some(
                rp => rp.permission.resource === resource && rp.permission.action === action
              )
              if (!hasPermission) {
                return false
              }
            }
          }
          return true
        }
      }
    }

    // If checking by userId
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          dynamicRole: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      })

      if (!user) {
        return false
      }

      // Admin has all permissions (case-insensitive: ADMIN, Admin, admin)
      if (isAdminRole(user.role)) {
        return true
      }

      // Check system role permissions
      if (user.role && isSystemRole(user.role)) {
        const systemRole = user.role.toUpperCase()
        const roleConfig = {
          ADMIN: admin,
          CLINIC: clinic,
          DOCTOR: doctor,
          PATIENT: patient,
        }[systemRole]

        if (roleConfig) {
          for (const [resource, actions] of Object.entries(permissions)) {
            const rolePermissions = (roleConfig.statements as Record<string, readonly string[]>)[
              resource
            ]
            if (!rolePermissions) {
              return false
            }

            for (const action of actions) {
              // biome-ignore lint/suspicious/noExplicitAny: Action type needs to match permission string arrays
              if (!rolePermissions.includes(action as any)) {
                return false
              }
            }
          }
          return true
        }
      }

      // Check dynamic role permissions
      if (user.dynamicRole) {
        for (const [resource, actions] of Object.entries(permissions)) {
          for (const action of actions) {
            const hasPermission = user.dynamicRole.permissions.some(
              rp => rp.permission.resource === resource && rp.permission.action === action
            )
            if (!hasPermission) {
              return false
            }
          }
        }
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error in userHasPermission:', error)
    return false
  }
}

/**
 * Check role permission (similar to better-auth's checkRolePermission)
 * Can be used on client/server side with role name
 */
export function checkRolePermission(params: {
  role: string
  permissions: Record<string, string[]>
}): boolean {
  const { role, permissions } = params
  const upperRole = role.toUpperCase()

  // Check system roles
  if (isSystemRole(upperRole)) {
    const roleConfig = {
      ADMIN: admin,
      CLINIC: clinic,
      DOCTOR: doctor,
      PATIENT: patient,
    }[upperRole]

    if (roleConfig) {
      // Check all required permissions
      for (const [resource, actions] of Object.entries(permissions)) {
        const rolePermissions = (roleConfig.statements as Record<string, readonly string[]>)[
          resource
        ]
        if (!rolePermissions) {
          return false
        }

        for (const action of actions) {
          // biome-ignore lint/suspicious/noExplicitAny: Action type needs to match permission string arrays
          if (!rolePermissions.includes(action as any)) {
            return false
          }
        }
      }
      return true
    }
  }

  return false
}
