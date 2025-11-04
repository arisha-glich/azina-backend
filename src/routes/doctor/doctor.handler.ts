import * as HttpStatusCodes from 'stoker/http-status-codes'
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

      return c.json(
        {
          message: 'Doctor retrieved successfully',
          success: true,
          data: doctor,
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
          message: 'Professional info updated',
          success: true,
          data: result.doctor,
          onboarding_stage: result.onboarding_stage,
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

  update_my_doctor_professional_details: async c => {
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
          message: 'Professional details updated',
          success: true,
          data: result.doctor,
          onboarding_stage: result.onboarding_stage,
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

  update_my_doctor_documents: async c => {
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
          message: 'Documents updated',
          success: true,
          data: result.doctor,
          onboarding_stage: result.onboarding_stage,
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

  get_my_requests: async c => {
    try {
      const userId = c.get('user')?.id
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }
      const status =
        (c.req.query('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined) || undefined
      const items = await approvalService.getUserRequests(userId, status)
      return c.json(
        { message: 'Requests retrieved successfully', success: true, data: items },
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
      return c.json(
        { message: 'Latest request retrieved successfully', success: true, data: item ?? null },
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

      return c.json(
        {
          message: 'Approved doctors retrieved successfully',
          success: true,
          data: doctors,
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

      return c.json(
        {
          message: 'Doctor retrieved successfully',
          success: true,
          data: doctor,
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
