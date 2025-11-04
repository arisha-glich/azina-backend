import prisma from '~/lib/prisma'
import { approvalService } from './approval.service'

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

  // biome-ignore lint/suspicious/noExplicitAny: Clinic update data can have various shapes
  async updateClinicByUserId(userId: string, data: any) {
    // First, try to find clinic directly linked to user via user_id
    const clinicDirect = await prisma.clinic.findFirst({
      where: { user_id: userId },
    })

    let clinicId: string | null = null

    if (clinicDirect) {
      clinicId = clinicDirect.id
    } else {
      // If not found, check if user is a doctor and get their clinic
      const doctor = await prisma.doctor.findUnique({
        where: { user_id: userId },
        select: { clinic_id: true },
      })

      if (!doctor?.clinic_id) {
        return null
      }

      clinicId = doctor.clinic_id
    }

    // Update the clinic if we found one
    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data,
      include: { user: true, address: true },
    })

    // Create or update approval request
    await approvalService.createRequest(userId, 'CLINIC', clinicId, data)

    // Update user's onboarding_stage to CLINIC_APPROVAL_PENDING after profile update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { onboarding_stage: 'CLINIC_APPROVAL_PENDING' },
      select: { onboarding_stage: true },
    })

    return { clinic: updatedClinic, onboarding_stage: updatedUser.onboarding_stage }
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
