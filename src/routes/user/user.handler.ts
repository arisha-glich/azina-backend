import * as HttpStatusCodes from 'stoker/http-status-codes'
import { getUserPermissions } from '~/lib/auth-permissions'
import prisma from '~/lib/prisma'
import type { USER_ROUTES } from '~/routes/user/user.routes'
import { userService } from '~/services/user.service'
import type { HandlerMapFromRoutes } from '~/types'

export const USER_ROUTE_HANDLER: HandlerMapFromRoutes<typeof USER_ROUTES> = {
  get_my_onboarding_stage: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const onboarding_stage = await userService.getOnboardingStage(userId)

      return c.json({ onboarding_stage }, HttpStatusCodes.OK)
    } catch (error) {
      console.error('Error retrieving onboarding stage:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_my_onboarding_stage: async c => {
    try {
      const { onboarding_stage } = c.req.valid('json')
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const updatedUser = await userService.updateOnboardingStage(userId, onboarding_stage)

      if (!updatedUser) {
        return c.json({ message: 'User not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'Onboarding stage updated successfully',
          success: true,
          data: updatedUser,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating onboarding stage:', error)

      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return c.json({ message: 'User not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'Internal server error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_user_role: async c => {
    try {
      const { role } = c.req.valid('json')
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const updatedUser = await userService.updateUserRole(userId, role)

      if (!updatedUser) {
        return c.json({ message: 'User not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'User role updated successfully',
          success: true,
          data: updatedUser,
          onboarding_stage: updatedUser.onboarding_stage,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating user role:', error)

      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return c.json({ message: 'User not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'Internal server error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_permissions: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Get user with role information
      const user = await prisma.user.findUnique({
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

      if (!user) {
        return c.json({ message: 'User not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Get user permissions
      const permissions = await getUserPermissions(userId)

      return c.json(
        {
          message: 'Permissions retrieved successfully',
          success: true,
          data: {
            userId: user.id,
            role: user.role,
            dynamicRole: user.dynamicRole,
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
}
