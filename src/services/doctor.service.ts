import prisma from '~/lib/prisma'
import { approvalService } from './approval.service'
import { emailHelpers } from '~/lib/email/service'

export const doctorService = {
  async getDoctorByUserId(userId: string) {
    return await prisma.doctor.findUnique({
      where: { user_id: userId },
      include: {
        user: true,
        clinic: true,
      },
    })
  },

  /**
   * Get all doctors approved by admin (onboarding_stage = 'APPROVED_BY_ADMIN')
   */
  async getApprovedDoctors() {
    return await prisma.doctor.findMany({
      where: {
        user: {
          onboarding_stage: 'APPROVED_BY_ADMIN',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            phone_no: true,
            dob: true,
            gender: true,
            onboarding_stage: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        clinic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  /**
   * Get doctor by ID with full details (Doctor and User schema)
   */
  async getDoctorById(doctorId: string) {
    return await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            phone_no: true,
            dob: true,
            gender: true,
            onboarding_stage: true,
            emailVerified: true,
            banned: true,
            banReason: true,
            banExpiresAt: true,
            meta: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        clinic: {
          include: {
            address: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })
  },

  /**
   * Update doctor profile by user ID without changing onboarding stage
   * Simple update - no approval routing
   */
  // biome-ignore lint/suspicious/noExplicitAny: Doctor update data can have various shapes
  async updateDoctorByUserIdSimple(userId: string, data: any) {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { user_id: userId },
      include: {
        user: true,
        clinic: true,
      },
    })

    if (!existingDoctor) {
      return null
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: existingDoctor.id },
      data,
      include: {
        user: true,
        clinic: true,
      },
    })

    return updatedDoctor
  },

  /**
   * Update doctor documents and always route the request to admin for approval.
   */
  // biome-ignore lint/suspicious/noExplicitAny: Doctor update data can have various shapes
  async submitDocumentsForAdminApproval(userId: string, data: any) {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { user_id: userId },
      include: {
        user: true,
        clinic: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!existingDoctor) {
      return null
    }

    const onboardingStageBefore = existingDoctor.user?.onboarding_stage
    const hasClinic = Boolean(existingDoctor.clinic?.id)

    const updatedDoctor = await prisma.doctor.update({
      where: { id: existingDoctor.id },
      data,
      include: {
        user: true,
        clinic: {
          include: {
            user: true,
          },
        },
      },
    })

    const doctorName =
      updatedDoctor.user?.name || updatedDoctor.user?.email || 'Doctor'
    const doctorEmail = updatedDoctor.user?.email || 'Not provided'
    const updatedAtIso = new Date().toISOString()

    let onboardingStage: string

    if (onboardingStageBefore === 'doctor-clinic-detail' && hasClinic) {
      onboardingStage = 'CLINIC_APPROVAL_PENDING'
      await approvalService.createClinicRequest(
        userId,
        updatedDoctor.id,
        { section: 'documents', data },
        updatedDoctor.clinic!.id
      )

      const clinicRecipient =
        updatedDoctor.clinic?.user?.email || updatedDoctor.clinic?.email

      if (clinicRecipient) {
        await emailHelpers.notifyClinicDoctorDocumentsUpdated(clinicRecipient, {
          doctorName,
          doctorEmail,
          clinicName: updatedDoctor.clinic?.clinic_name,
          updatedAt: updatedAtIso,
        })
      }
    } else {
      onboardingStage = 'DOCTOR_APPROVAL_PENDING'
      await approvalService.createRequest(userId, 'DOCTOR', updatedDoctor.id, {
        section: 'documents',
        data,
      })

      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            equals: 'ADMIN',
            mode: 'insensitive',
          },
        },
        select: {
          email: true,
        },
      })

      const adminEmails = adminUsers
        .map(user => user.email)
        .filter((email): email is string => Boolean(email))

      if (adminEmails.length) {
        await emailHelpers.notifyAdminsDoctorDocumentsUpdated(adminEmails, {
          doctorName,
          doctorEmail,
          updatedAt: updatedAtIso,
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_stage: onboardingStage,
      },
      select: {
        onboarding_stage: true,
      },
    })

    return {
      doctor: updatedDoctor,
      onboarding_stage: updatedUser.onboarding_stage,
    }
  },

  // biome-ignore lint/suspicious/noExplicitAny: Doctor update data can have various shapes
  async notifyDocumentsUpdate(
    userId: string,
    data: any,
    options?: { fallback?: 'admin' | 'self' }
  ) {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { user_id: userId },
      include: {
        user: true,
        clinic: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!existingDoctor) {
      return null
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: existingDoctor.id },
      data,
      include: {
        user: true,
        clinic: {
          include: {
            user: true,
          },
        },
      },
    })

    const doctorName =
      updatedDoctor.user?.name || updatedDoctor.user?.email || 'Doctor'
    const doctorEmail = updatedDoctor.user?.email || 'Not provided'
    const updatedAtIso = new Date().toISOString()

    let notificationTarget: 'clinic' | 'admin' | 'self' | 'none' = 'none'

    const fallback = options?.fallback ?? 'admin'

    const notifyAdmins = async () => {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            equals: 'ADMIN',
            mode: 'insensitive',
          },
        },
        select: {
          email: true,
        },
      })

      const adminEmails = adminUsers
        .map(user => user.email)
        .filter((email): email is string => Boolean(email))

      if (adminEmails.length) {
        await emailHelpers.notifyAdminsDoctorDocumentsUpdated(adminEmails, {
          doctorName,
          doctorEmail,
          updatedAt: updatedAtIso,
        })
        notificationTarget = 'admin'
      }
    }

    if (updatedDoctor.clinic) {
      const clinicRecipient =
        updatedDoctor.clinic.user?.email || updatedDoctor.clinic.email

      if (clinicRecipient) {
        await emailHelpers.notifyClinicDoctorDocumentsUpdated(clinicRecipient, {
          doctorName,
          doctorEmail,
          clinicName: updatedDoctor.clinic.clinic_name,
          updatedAt: updatedAtIso,
        })
        notificationTarget = 'clinic'
      }
    }

    if (notificationTarget === 'none') {
      if (fallback === 'admin') {
        await notifyAdmins()
      } else if (fallback === 'self' && updatedDoctor.user?.email) {
        await emailHelpers.notifyDoctorDocumentsUpdatedSelf(updatedDoctor.user.email, {
          doctorName,
          updatedAt: updatedAtIso,
        })
        notificationTarget = 'self'
      }
    }

    return {
      doctor: updatedDoctor,
      notificationTarget,
      updatedAt: updatedAtIso,
    }
  },

  /**
   * Update doctor profile by user ID
   *
   * Approval Routing Logic:
   * - If onboarding_stage = 'doctor-clinic-detail' → Routes to clinic approval (uses clinic_id)
   * - If onboarding_stage = 'doctor-detail' → Routes to admin approval
   * - Otherwise → Routes to admin approval (default)
   *
   * This applies to all doctor update endpoints:
   * - PATCH /api/v1/doctor/me
   * - PATCH /api/v1/doctor/me/professional-info
   * - PATCH /api/v1/doctor/me/professional-details
   * - PATCH /api/v1/doctor/me/documents
   */
  // biome-ignore lint/suspicious/noExplicitAny: Doctor update data can have various shapes
  async updateDoctorByUserId(userId: string, data: any) {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { user_id: userId },
      include: {
        user: true,
        clinic: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!existingDoctor) {
      return null
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: existingDoctor.id },
      data,
      include: {
        user: true,
        clinic: {
          include: {
            user: true,
          },
        },
      },
    })

    const clinicId = updatedDoctor.clinic?.id
    let newOnboardingStage: string

    if (clinicId) {
      newOnboardingStage = 'CLINIC_APPROVAL_PENDING'
      await approvalService.createClinicRequest(userId, updatedDoctor.id, data, clinicId)
    } else {
      newOnboardingStage = 'DOCTOR_APPROVAL_PENDING'

      await approvalService.createRequest(userId, 'DOCTOR', updatedDoctor.id, data)
    }

    // Update user's onboarding_stage based on routing
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_stage: newOnboardingStage,
      },
      select: {
        onboarding_stage: true,
      },
    })

    return {
      doctor: updatedDoctor,
      onboarding_stage: updatedUser.onboarding_stage,
    }
  },
}
