import { emailHelpers } from '~/lib/email/service'
import prisma from '~/lib/prisma'

export const userService = {
  async getOnboardingStage(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboarding_stage: true,
      },
    })

    return user?.onboarding_stage ?? null
  },

  async updateOnboardingStage(userId: string, onboardingStage: string) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_stage: onboardingStage,
      },
      select: {
        id: true,
        email: true,
        onboarding_stage: true,
      },
    })

    return updatedUser
  },

  async updateUserRole(userId: string, role: string) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser) {
      return null
    }

    // Determine onboarding_stage based on role
    let onboardingStage: string | undefined
    if (role === 'CLINIC') {
      onboardingStage = 'clinic-detail'
    } else if (role === 'DOCTOR') {
      onboardingStage = 'doctor-detail'
    } else if (role === 'PATIENT') {
      onboardingStage = 'patient-detail'
    }

    // Update user role and onboarding_stage
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        ...(onboardingStage && { onboarding_stage: onboardingStage }),
      },
    })

    // Automatically create related records based on role
    if (role === 'CLINIC') {
      const existingClinic = await prisma.clinic.findFirst({
        where: {
          doctors: {
            some: {
              user_id: userId,
            },
          },
        },
      })

      if (!existingClinic) {
        const userName = currentUser.name || currentUser.email.split('@')[0]
        const clinicName = `${userName}'s Clinic`

        const clinic = await prisma.clinic.create({
          data: {
            clinic_name: clinicName,
            email: currentUser.email,
            phone_number: currentUser.phone_no,
            user_id: userId,
            is_active: true,
          },
        })

        await prisma.doctor.create({
          data: {
            user_id: userId,
            clinic_id: clinic.id,

            specialization: 'Administrator',
            license_number: `ADMIN-${userId.slice(0, 8)}`,
          },
        })

      }
    } else if (role === 'DOCTOR') {
      const existingDoctor = await prisma.doctor.findUnique({
        where: { user_id: userId },
      })

      if (!existingDoctor) {
        await prisma.doctor.create({
          data: {
            user_id: userId,
            specialization: 'General',
            license_number: `DOC-${userId.slice(0, 8)}`,
          },
        })

      }
    } else if (role === 'PATIENT') {
      const existingPatient = await prisma.patient.findUnique({
        where: { user_id: userId },
      })

      if (!existingPatient) {
        await prisma.patient.create({
          data: {
            user_id: userId,
            gender: currentUser.gender,
            phone_number: currentUser.phone_no,
          },
        })

      }
    }

    // Send welcome email based on role
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const loginLink = `${frontendUrl}/login`
      const userName = currentUser.name || currentUser.email.split('@')[0]

      if (role === 'PATIENT') {
        await emailHelpers.sendWelcomeEmail(currentUser.email, {
          patientName: userName,
          loginLink,
        })
      } else if (role === 'CLINIC' || role === 'DOCTOR') {
        await emailHelpers.sendGenericWelcomeEmail(currentUser.email, {
          name: userName,
          role,
          loginLink,
        })
      }
    } catch (error) {
      console.error(`❌ Error sending welcome email to ${currentUser.email}:`, error)
      // Don't fail the role update if email fails
    }

    return updatedUser
  },
}
