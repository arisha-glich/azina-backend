import prisma from '~/lib/prisma'

/**
 * Automatically create Doctor or Clinic profile when a user is created with those roles
 */
export const profileAutoCreateService = {
  async createProfileIfNeeded(
    userId: string,
    role: string | null | undefined,
    options?: { clinicId?: string }
  ) {
    if (!role) {
      return
    }

    const roleUpper = role.toUpperCase()

    try {
      // Create Doctor profile if role is DOCTOR
      if (roleUpper === 'DOCTOR') {
        // Check if doctor profile already exists
        const existingDoctor = await prisma.doctor.findUnique({
          where: { user_id: userId },
        })

        if (!existingDoctor) {
          // Create a basic doctor profile with minimal required fields
          await prisma.doctor.create({
            data: {
              user_id: userId,
              specialization: 'General Practice', // Default, can be updated later
              license_number: `DOC-${userId.slice(0, 8)}-${Date.now()}`, // Generate unique license number
              availability_status: 'AVAILABLE',
              clinic_id: options?.clinicId || null, // Link to clinic if provided
            },
          })

        }
      }

      // Create Clinic profile if role is CLINIC
      if (roleUpper === 'CLINIC') {
        // Check if clinic profile already exists for this user
        const existingClinic = await prisma.clinic.findFirst({
          where: { user_id: userId },
        })

        if (!existingClinic) {
          // Get user's name or email for clinic name
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          })

          const clinicName = user?.name || user?.email || `Clinic-${userId.slice(0, 8)}`

          // Create a basic clinic profile with minimal required fields
          await prisma.clinic.create({
            data: {
              clinic_name: clinicName,
              user_id: userId,
              is_active: true,
            },
          })

        }
      }
    } catch (error) {
      console.error(`❌ Error creating profile for user ${userId} with role ${role}:`, error)
      // Don't throw - we don't want to fail user creation if profile creation fails
    }
  },
}
