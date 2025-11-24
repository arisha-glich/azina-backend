import * as HttpStatusCodes from 'stoker/http-status-codes'
import { convertImagesToSignedUrls } from '~/lib/image-url-converter'
import type { DOCTOR_ROUTES } from '~/routes/doctor/doctor.routes'
import { approvalService } from '~/services/approval.service'
import { doctorService } from '~/services/doctor.service'
import type { HandlerMapFromRoutes } from '~/types'

export const DOCTOR_ROUTE_HANDLER: HandlerMapFromRoutes<typeof DOCTOR_ROUTES> = {
  get_my_doctor: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await doctorService.getDoctorByUserId(userId)

      if (!doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      // Convert image URLs to signed URLs
      const processedDoctor = await convertImagesToSignedUrls(doctor)

      return c.json(
        {
          message: 'Doctor retrieved successfully',
          success: true,
          data: processedDoctor,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving doctor:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_clinic_link_status: async c => {
    try {
      const user = c.get('user')

      if (!user?.id) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const status = await doctorService.getClinicLinkStatusByUserId(user.id)

      if (!status) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Clinic link status retrieved successfully',
          success: true,
          data: status,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving clinic link status:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_my_doctor: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const result = await doctorService.updateDoctorByUserId(userId, updateData)

      if (!result || !result.doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Doctor updated successfully',
          success: true,
          data: result.doctor,
          onboarding_stage: result.onboarding_stage,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating doctor:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_my_doctor_professional_info: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await doctorService.updateDoctorByUserIdSimple(userId, updateData)
      if (!doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }
      return c.json(
        {
          message: 'Professional info updated',
          success: true,
          data: doctor,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating professional info:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  create_my_doctor_professional_info: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await doctorService.updateDoctorByUserIdSimple(userId, updateData)
      if (!doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }
      return c.json(
        {
          message: 'Professional info updated',
          success: true,
          data: {
            license_number: doctor.license_number,
            regulatoryBody: doctor.regulatoryBody,
            professional_email: doctor.professional_email,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating professional info:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_doctor_professional_info: async c => {
    try {
      const userId = c.get('user')?.id
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await doctorService.getDoctorByUserId(userId)
      if (!doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const professionalInfo = {
        license_number: doctor.license_number,
        regulatoryBody: doctor.regulatoryBody,
        professional_email: doctor.professional_email,
      }

      // Convert image URLs to signed URLs (if any)
      const processedInfo = await convertImagesToSignedUrls(professionalInfo)

      return c.json(
        {
          message: 'Professional info retrieved successfully',
          success: true,
          data: processedInfo,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving professional info:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_my_doctor_professional_details: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await doctorService.updateDoctorByUserIdSimple(userId, updateData)
      if (!doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }
      return c.json(
        {
          message: 'Professional details updated',
          success: true,
          data: doctor,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating professional details:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  create_my_doctor_professional_details: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await doctorService.updateDoctorByUserIdSimple(userId, updateData)
      if (!doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }
      return c.json(
        {
          message: 'Professional details updated',
          success: true,
          data: {
            specialization: doctor.specialization,
            experience_years: doctor.experience_years,
            professional: doctor.professional,
            availability_status: doctor.availability_status,
            bio: doctor.bio,
            consultation_fee: doctor.consultation_fee,
            areas_of_expertise: doctor.areas_of_expertise,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating professional details:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_doctor_professional_details: async c => {
    try {
      const userId = c.get('user')?.id
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await doctorService.getDoctorByUserId(userId)
      if (!doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const professionalDetails = {
        specialization: doctor.specialization,
        experience_years: doctor.experience_years,
        professional: doctor.professional,
        availability_status: doctor.availability_status,
        bio: doctor.bio,
        consultation_fee: doctor.consultation_fee,
        areas_of_expertise: doctor.areas_of_expertise,
      }

      // Convert image URLs to signed URLs (if any)
      const processedDetails = await convertImagesToSignedUrls(professionalDetails)

      return c.json(
        {
          message: 'Professional details retrieved successfully',
          success: true,
          data: processedDetails,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving professional details:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_my_doctor_documents: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const result = await doctorService.submitDocumentsForAdminApproval(userId, updateData)
      if (!result) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }
      const { doctor, onboarding_stage: onboardingStage } = result

      const processedDoctor = await convertImagesToSignedUrls(doctor)

      return c.json(
        {
          message: 'Documents updated and approval request sent',
          success: true,
          data: {
            doctor: processedDoctor,
            onboardingStage,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating documents:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  create_my_doctor_documents: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const result = await doctorService.notifyDocumentsUpdate(userId, updateData, {
        fallback: 'self',
      })
      if (!result) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const processedDoctor = await convertImagesToSignedUrls(result.doctor)

      return c.json(
        {
          message: 'Documents updated and notifications sent',
          success: true,
          data: {
            doctor: processedDoctor,
            notificationTarget: result.notificationTarget,
            notifiedAt: result.updatedAt,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating documents:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_doctor_documents: async c => {
    try {
      const userId = c.get('user')?.id
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await doctorService.getDoctorByUserId(userId)
      if (!doctor) {
        return c.json(
          {
            message: 'Doctor profile not found. Please ensure your user role is set to DOCTOR.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const documents = {
        resume: doctor.resume,
        idemnityInsaurance: doctor.idemnityInsaurance,
        other_documents: doctor.other_documents,
        signature: doctor.signature,
        Logo: doctor.Logo,
      }

      // Convert image URLs to signed URLs
      const processedDocuments = await convertImagesToSignedUrls(documents)

      return c.json(
        {
          message: 'Documents retrieved successfully',
          success: true,
          data: processedDocuments,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving documents:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_requests: async c => {
    try {
      const userId = c.get('user')?.id
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }
      const status =
        (c.req.query('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined) || undefined
      const items = await approvalService.getUserRequests(userId, status)

      // Convert image URLs to signed URLs
      const processedItems = await convertImagesToSignedUrls(items)

      return c.json(
        { message: 'Requests retrieved successfully', success: true, data: processedItems },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving requests:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_latest_request: async c => {
    try {
      const userId = c.get('user')?.id
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }
      const status =
        (c.req.query('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined) || undefined
      const item = await approvalService.getLatestUserRequest(userId, status)

      // Convert image URLs to signed URLs
      const processedItem = item ? await convertImagesToSignedUrls(item) : null

      return c.json(
        { message: 'Latest request retrieved successfully', success: true, data: processedItem },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving latest request:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_request_status: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const request = await approvalService.getRequestByUserId(userId)

      return c.json(
        {
          message: 'Request status retrieved successfully',
          success: true,
          data: request
            ? {
                id: request.id,
                request_type: request.request_type,
                status: request.status,
                rejection_reason: request.rejection_reason,
                reviewed_at: request.reviewed_at,
                createdAt: request.createdAt,
              }
            : null,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving request status:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_approved_doctors: async c => {
    try {
      const doctors = await doctorService.getApprovedDoctors()

      // Convert image URLs to signed URLs
      const processedDoctors = await convertImagesToSignedUrls(doctors)

      return c.json(
        {
          message: 'Approved doctors retrieved successfully',
          success: true,
          data: processedDoctors,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving approved doctors:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_doctor_by_id: async c => {
    try {
      const { id } = c.req.valid('param')
      const doctor = await doctorService.getDoctorById(id)

      if (!doctor) {
        return c.json({ message: 'Doctor not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Convert image URLs to signed URLs
      const processedDoctor = await convertImagesToSignedUrls(doctor)

      return c.json(
        {
          message: 'Doctor retrieved successfully',
          success: true,
          data: processedDoctor,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving doctor:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
} as HandlerMapFromRoutes<typeof DOCTOR_ROUTES>
