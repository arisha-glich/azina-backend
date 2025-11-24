import * as HttpStatusCodes from 'stoker/http-status-codes'
import prisma from '~/lib/prisma'
import { doctorService } from '~/services/doctor.service'
import { TIME_SLOT_SERVICES } from '~/services/timeslot.service'
import type { TIMESLOT_ROUTES } from '~/routes/doctor/timeslots/timeslot.routes'
import type { HandlerMapFromRoutes } from '~/types'
import { HttpError } from '~/lib/error'

// Helper function to get doctor with fallback
async function getDoctorWithFallback(userId: string, userRole?: string) {
  let doctor = await doctorService.getDoctorByUserId(userId)

  if (!doctor) {
    const slotWithDoctor = await prisma.appointment_Slot.findFirst({
      where: {
        doctor: {
          user_id: userId,
        },
      },
      include: {
        doctor: {
          include: {
            user: true,
            clinic: true,
          },
        },
      },
    })

    if (slotWithDoctor?.doctor) {
      doctor = slotWithDoctor.doctor
    } else if (userRole?.toUpperCase() === 'DOCTOR') {
      const { profileAutoCreateService } = await import('~/services/profile-auto-create.service')
      await profileAutoCreateService.createProfileIfNeeded(userId, userRole)
      doctor = await doctorService.getDoctorByUserId(userId)
    }
  }

  return doctor
}

export const TIMESLOT_ROUTE_HANDLER: HandlerMapFromRoutes<typeof TIMESLOT_ROUTES> = {
  create_timeslot: async c => {
    try {
      const userId = c.get('user')?.id
      const userRole = c.get('user')?.role

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await getDoctorWithFallback(userId, userRole ?? undefined)

      if (!doctor) {
        return c.json(
          { message: 'Doctor profile not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const payload = c.req.valid('json')
      const slotDate = new Date(payload.slot_date)

      const timeslot = await TIME_SLOT_SERVICES.create({
        doctorId: doctor.id,
        slotDate,
        startTime: payload.start_time,
        endTime: payload.end_time,
        isAvailable: payload.is_available,
        consultationType: payload.consultation_type,
      })

      return c.json(
        {
          message: 'Timeslot created successfully',
          success: true,
          data: timeslot,
        },
        HttpStatusCodes.CREATED
      )
    } catch (error) {
      if (error instanceof HttpError) {
        return c.json(
          { message: error.message, success: false },
          error.statusCode as any
        )
      }
      console.error('Error creating timeslot:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  create_bulk_timeslots: async c => {
    try {
      const userId = c.get('user')?.id
      const userRole = c.get('user')?.role

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await getDoctorWithFallback(userId, userRole ?? undefined)

      if (!doctor) {
        return c.json(
          { message: 'Doctor profile not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const { timeslots } = c.req.valid('json')

      const slotsData = timeslots.map(slot => ({
        doctorId: doctor.id,
        slotDate: new Date(slot.slot_date),
        startTime: slot.start_time,
        endTime: slot.end_time,
        isAvailable: slot.is_available,
        consultationType: slot.consultation_type,
      }))

      const result = await TIME_SLOT_SERVICES.bulkCreate(slotsData)

      return c.json(
        {
          message: 'Timeslots created',
          success: true,
          data: result,
        },
        HttpStatusCodes.CREATED
      )
    } catch (error) {
      if (error instanceof HttpError) {
        return c.json(
          { message: error.message, success: false },
          error.statusCode as any
        )
      }
      console.error('Error creating bulk timeslots:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_timeslots: async c => {
    try {
      const userId = c.get('user')?.id
      const userRole = c.get('user')?.role

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const query = c.req.valid('query')

      // Get doctor information
      const doctor = await getDoctorWithFallback(userId, userRole ?? undefined)

      const filters: any = {
        userId, // Use userId instead of doctorId
      }

      if (query.date) filters.date = new Date(query.date)
      if (query.startDate) filters.startDate = new Date(query.startDate)
      if (query.endDate) filters.endDate = new Date(query.endDate)
      if (query.isAvailable !== undefined) filters.isAvailable = query.isAvailable
      if (query.startTime) filters.startTime = query.startTime
      if (query.endTime) filters.endTime = query.endTime
      if (query.consultationType) filters.consultationType = query.consultationType

      const pagination: any = {}
      if (query.page) pagination.page = query.page
      if (query.limit) pagination.limit = query.limit

      // Debug: Log the filters being passed
      console.log('Getting timeslots with filters:', JSON.stringify({ ...filters, ...pagination }, null, 2))
      console.log('UserId:', userId)

      const result = await TIME_SLOT_SERVICES.getAll({ ...filters, ...pagination })

      // Debug: Log the result
      console.log('Timeslots found:', result.timeslots.length, 'Total:', result.pagination.total)

      return c.json(
        {
          message: 'Timeslots retrieved successfully',
          success: true,
          data: {
            ...result,
            doctor: doctor || null,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        return c.json(
          { message: error.message, success: false },
          error.statusCode as any
        )
      }
      console.error('Error retrieving timeslots:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_timeslot_by_id: async c => {
    try {
      const userId = c.get('user')?.id
      const userRole = c.get('user')?.role

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await getDoctorWithFallback(userId, userRole ?? undefined)

      if (!doctor) {
        return c.json(
          { message: 'Doctor profile not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const { timeslotId } = c.req.valid('param')

      const timeslot = await TIME_SLOT_SERVICES.getById(timeslotId)

      // Verify ownership
      if (timeslot.doctor_id !== doctor.id) {
        return c.json(
          { message: 'Timeslot not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Timeslot retrieved successfully',
          success: true,
          data: timeslot,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        return c.json(
          { message: error.message, success: false },
          error.statusCode as any
        )
      }
      console.error('Error retrieving timeslot:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_timeslot: async c => {
    try {
      const userId = c.get('user')?.id
      const userRole = c.get('user')?.role

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await getDoctorWithFallback(userId, userRole ?? undefined)

      if (!doctor) {
        return c.json(
          { message: 'Doctor profile not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const { timeslotId } = c.req.valid('param')
      const payload = c.req.valid('json')

      const updateData: any = {}
      if (payload.slot_date) updateData.slotDate = new Date(payload.slot_date)
      if (payload.start_time) updateData.startTime = payload.start_time
      if (payload.end_time) updateData.endTime = payload.end_time
      if (payload.is_available !== undefined) updateData.isAvailable = payload.is_available
      if (payload.consultation_type) updateData.consultationType = payload.consultation_type

      const timeslot = await TIME_SLOT_SERVICES.update(timeslotId, updateData, doctor.id)

      return c.json(
        {
          message: 'Timeslot updated successfully',
          success: true,
          data: timeslot,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        return c.json(
          { message: error.message, success: false },
          error.statusCode as any
        )
      }
      console.error('Error updating timeslot:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  delete_timeslot: async c => {
    try {
      const userId = c.get('user')?.id
      const userRole = c.get('user')?.role

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await getDoctorWithFallback(userId, userRole ?? undefined)

      if (!doctor) {
        return c.json(
          { message: 'Doctor profile not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const { timeslotId } = c.req.valid('param')

      const timeslot = await TIME_SLOT_SERVICES.delete(timeslotId, doctor.id)

      return c.json(
        {
          message: 'Timeslot deleted successfully',
          success: true,
          data: timeslot,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        return c.json(
          { message: error.message, success: false },
          error.statusCode as any
        )
      }
      console.error('Error deleting timeslot:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  delete_all_timeslots: async c => {
    try {
      const userId = c.get('user')?.id
      const userRole = c.get('user')?.role

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const doctor = await getDoctorWithFallback(userId, userRole ?? undefined)

      if (!doctor) {
        return c.json(
          { message: 'Doctor profile not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const result = await TIME_SLOT_SERVICES.deleteAll(doctor.id)

      return c.json(
        {
          message: 'Timeslots deleted successfully',
          success: true,
          data: result,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        return c.json(
          { message: error.message, success: false },
          error.statusCode as any
        )
      }
      console.error('Error deleting all timeslots:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}

