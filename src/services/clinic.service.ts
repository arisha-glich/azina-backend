import prisma from '~/lib/prisma'
import { approvalService } from './approval.service'
import { emailHelpers } from '~/lib/email/service'

async function findClinicForUser(userId: string) {
  const clinicDirect = await prisma.clinic.findFirst({
    where: { user_id: userId },
    include: { user: true, address: true },
  })

  if (clinicDirect) {
    return clinicDirect
  }

  const doctor = await prisma.doctor.findUnique({
    where: { user_id: userId },
    select: { clinic_id: true },
  })

  if (!doctor?.clinic_id) {
    return null
  }

  return prisma.clinic.findUnique({
    where: { id: doctor.clinic_id },
    include: { user: true, address: true },
  })
}

export const clinicService = {
  async getClinicByUserId(userId: string) {
    // First, try to find clinic directly linked to user via user_id
    const clinicDirect = await prisma.clinic.findFirst({
      where: { user_id: userId },
      include: { user: true, address: true },
    })

    if (clinicDirect) {
      return clinicDirect
    }

    // If not found, check if user is a doctor and get their clinic
    const doctor = await prisma.doctor.findUnique({
      where: { user_id: userId },
      select: { clinic_id: true },
    })

    if (!doctor?.clinic_id) {
      return null
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: doctor.clinic_id },
      include: { user: true, address: true },
    })

    return clinic
  },

  /**
   * Get all clinics approved by admin (onboarding_stage = 'APPROVED_BY_ADMIN')
   */
  async getApprovedClinics() {
    return await prisma.clinic.findMany({
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
        address: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  /**
   * Get clinic by ID with full details (Clinic and User schema)
   */
  async getClinicById(clinicId: string) {
    return await prisma.clinic.findUnique({
      where: { id: clinicId },
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
        address: {
          select: {
            id: true,
            street_address: true,
            city: true,
            state: true,
            postal_code: true,
            country: true,
            latitude: true,
            longitude: true,
            is_active: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        doctors: {
          select: {
            id: true,
            specialization: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })
  },

  /**
   * Update clinic profile by user ID without changing onboarding stage
   * Simple update - no approval routing
   */
  // biome-ignore lint/suspicious/noExplicitAny: Clinic update data can have various shapes
  async updateClinicByUserIdSimple(userId: string, data: any) {
    const clinic = await findClinicForUser(userId)
    if (!clinic) {
      return null
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinic.id },
      data,
      include: { user: true, address: true },
    })

    return updatedClinic
  },

  // biome-ignore lint/suspicious/noExplicitAny: Clinic update data can have various shapes
  async updateClinicByUserId(userId: string, data: any) {
    const clinic = await findClinicForUser(userId)
    if (!clinic) {
      return null
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinic.id },
      data,
      include: { user: true, address: true },
    })

    await approvalService.createRequest(userId, 'CLINIC', updatedClinic.id, data)

    // Update user's onboarding_stage to CLINIC_APPROVAL_PENDING after profile update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { onboarding_stage: 'CLINIC_APPROVAL_PENDING' },
      select: { onboarding_stage: true },
    })

    return { clinic: updatedClinic, onboarding_stage: updatedUser.onboarding_stage }
  },

  // biome-ignore lint/suspicious/noExplicitAny: Clinic update data can have various shapes
  async notifyClinicDocumentsUpdate(userId: string, data: any) {
    const clinic = await findClinicForUser(userId)
    if (!clinic) {
      return null
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinic.id },
      data,
      include: { user: true, address: true },
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

    const updatedAtIso = new Date().toISOString()

    if (adminEmails.length) {
      await emailHelpers.notifyAdminsClinicDocumentsUpdated(adminEmails, {
        clinicName: updatedClinic.clinic_name,
        clinicEmail: updatedClinic.user?.email || 'Not provided',
        updatedAt: updatedAtIso,
      })
    }

    return {
      clinic: updatedClinic,
      notificationTarget: adminEmails.length ? 'admin' : 'none',
      updatedAt: updatedAtIso,
    }
  },

  /**
   * Get all approved doctors for a specific clinic
   * Only returns doctors with onboarding_stage = 'APPROVED_BY_ADMIN'
   */
  async getApprovedClinicDoctors(clinicId: string) {
    return await prisma.doctor.findMany({
      where: {
        clinic_id: clinicId,
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
        clinic: {
          select: {
            id: true,
            clinic_name: true,
            user_id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  /**
   * Get clinic doctor by ID with full details
   * Verifies the doctor belongs to the specified clinic
   */
  async getClinicDoctorById(clinicId: string, doctorId: string) {
    return await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        clinic_id: clinicId,
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
}
