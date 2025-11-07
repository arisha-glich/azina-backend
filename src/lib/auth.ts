// lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin as adminPlugin, openAPI, organization } from 'better-auth/plugins'
import { ORIGINS } from '~/config/origins'
import { ac, admin, clinic, isAdminRole, user } from '~/lib/auth-permissions'
import prisma from '~/lib/prisma'

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    additionalFields: {
      onboarding_stage: {
        type: 'string',
        defaultValue: 'ROLE_SELECTION',
        databaseName: 'onboarding_stage',
      },
      banExpires: {
        type: 'date',
        databaseName: 'banExpiresAt',
      },
    },
  },
  trustedOrigins: ORIGINS,
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        ADMIN: admin,
        user,
        USER: user,
        clinic,
        CLINIC: clinic,
      },
      authorized: async (user: { role?: string | null; roles?: (string | null)[]; primaryRole?: string | null }) => {
        const potentialRoles = [user.role, user.primaryRole]

        if (Array.isArray(user.roles)) {
          potentialRoles.push(...user.roles)
        }

        return potentialRoles.some(role => isAdminRole(role ?? undefined))
      },
    }),
    organization({
      allowUserToCreateOrganization: async user => {
        // Only CLINIC users or ADMIN can create organizations
        return user.role === 'CLINIC' || isAdminRole(user.role)
      },
      organizationLimit: 100,
      creatorRole: 'owner',

      sendInvitationEmail: async data => {
        const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${data.id}`
        // TODO: Implement email service
      },
    }),
    openAPI({
      theme: 'kepler',
    }),
  ],
})
