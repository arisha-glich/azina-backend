import prisma from '~/lib/prisma'
import { approvalService } from './approval.service'

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

    // Use clinic_id from updated doctor (after update) to ensure we have the latest value
    const clinicId = updatedDoctor.clinic_id
    let newOnboardingStage: string

    console.log(
      `[Doctor Update] Doctor ID: ${updatedDoctor.id}, Clinic ID: ${clinicId}, User ID: ${userId}`
    )

    // If doctor is linked to a clinic, send request to that clinic
    if (clinicId) {
      newOnboardingStage = 'CLINIC_APPROVAL_PENDING'
      console.log(
        `[Doctor Update] ✅ Routing doctor ${userId} approval request to clinic ${clinicId}`
      )

      await approvalService.createClinicRequest(userId, updatedDoctor.id, data, clinicId)
    } else {
      // No clinic linked, send to admin
      newOnboardingStage = 'DOCTOR_APPROVAL_PENDING'
      console.log(
        `[Doctor Update] ❌ Routing doctor ${userId} approval request to admin - NO CLINIC_ID FOUND!`
      )

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
