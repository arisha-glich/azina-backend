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
        user,
        clinic,
      },
      authorized: async (user: { role?: string | null }) => {
        // Check if user has ADMIN role
        return isAdminRole(user.role)
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

        console.log('Send invitation email:', {
          to: data.email,
          organizationId: data.organization.id,
          inviterName: data.inviter.user.name,
          role: data.role,
          link: invitationLink,
        })

        // TODO: Implement email service
      },
    }),
    openAPI({
      theme: 'kepler',
    }),
  ],
})
