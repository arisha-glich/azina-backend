import { Prisma } from '@prisma/client'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'

export interface CreateTimeSlotData {
  doctorId: string
  slotDate: Date
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  isAvailable?: boolean
  consultationType?: 'BOTH' | 'IN_PERSON' | 'VIDEO_CALL'
}

export interface UpdateTimeSlotData {
  slotDate?: Date
  startTime?: string
  endTime?: string
  isAvailable?: boolean
  consultationType?: 'BOTH' | 'IN_PERSON' | 'VIDEO_CALL'
}

export interface TimeSlotFilters {
  userId?: string // Filter by user ID (through doctor relation)
  doctorId?: string // Filter by doctor ID (alternative to userId)
  date?: Date
  startDate?: Date
  endDate?: Date
  startTime?: string // HH:mm format
  endTime?: string // HH:mm format
  isAvailable?: boolean
  consultationType?: 'BOTH' | 'IN_PERSON' | 'VIDEO_CALL'
  available?: boolean // filter for slots without active appointments
  page?: number
  limit?: number
}

export const TIME_SLOT_SERVICES = {
  create: async (data: CreateTimeSlotData) => {
    // Validate that the doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!doctor) {
      throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
    }

    // Validate time slot logic
    if (data.startTime >= data.endTime) {
      throw new HttpError('Start time must be before end time', HttpStatusCodes.BAD_REQUEST)
    }

    // Parse slot date to start of day for comparison
    const slotDateStart = new Date(data.slotDate)
    slotDateStart.setHours(0, 0, 0, 0)
    const slotDateEnd = new Date(data.slotDate)
    slotDateEnd.setHours(23, 59, 59, 999)

    // Check for overlapping time slots for the same doctor on the same date
    const overlappingSlot = await prisma.appointment_Slot.findFirst({
      where: {
        doctor_id: data.doctorId,
        slot_date: {
          gte: slotDateStart,
          lte: slotDateEnd,
        },
        OR: [
          {
            AND: [
              { start_time: { lte: data.startTime } },
              { end_time: { gt: data.startTime } },
            ],
          },
          {
            AND: [
              { start_time: { lt: data.endTime } },
              { end_time: { gte: data.endTime } },
            ],
          },
          {
            AND: [
              { start_time: { gte: data.startTime } },
              { end_time: { lte: data.endTime } },
            ],
          },
        ],
      },
    })

    if (overlappingSlot) {
      throw new HttpError('Time slot overlaps with existing slot', HttpStatusCodes.CONFLICT)
    }

    try {
      const timeSlot = await prisma.appointment_Slot.create({
        data: {
          doctor_id: data.doctorId,
          slot_date: data.slotDate,
          start_time: data.startTime,
          end_time: data.endTime,
          is_available: data.isAvailable ?? true,
          consultation_type: data.consultationType ?? 'BOTH',
        },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          appointments: {
            select: {
              id: true,
              status: true,
              patient: {
                include: {
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
          },
        },
      })

      return timeSlot
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string }
        if (prismaError.code === 'P2002') {
          throw new HttpError('Time slot already exists for this doctor', HttpStatusCodes.CONFLICT)
        }
      }
      throw error
    }
  },

  getAll: async (filters: TimeSlotFilters = {}) => {
    const {
      userId,
      doctorId,
      date,
      startDate,
      endDate,
      startTime,
      endTime,
      isAvailable,
      consultationType,
      available,
      page = 1,
      limit = 20,
    } = filters

    const skip = (page - 1) * limit

    const where: any = {}

    // Filter by userId (through doctor relation) - takes precedence over doctorId
    if (userId) {
      where.doctor = {
        user_id: userId,
      }
    } else if (doctorId) {
      where.doctor_id = doctorId
    }

    if (date) {
      const dateStart = new Date(date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date)
      dateEnd.setHours(23, 59, 59, 999)
      where.slot_date = {
        gte: dateStart,
        lte: dateEnd,
      }
    } else if (startDate || endDate) {
      where.slot_date = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        where.slot_date.gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.slot_date.lte = end
      }
    }

    if (startTime) {
      where.start_time = { gte: startTime }
    }

    if (endTime) {
      where.end_time = { lte: endTime }
    }

    if (isAvailable !== undefined) {
      where.is_available = isAvailable
    }

    if (consultationType) {
      where.consultation_type = consultationType
    }

    // Filter for available slots (not booked by active appointments)
    if (available === true) {
      where.OR = [
        { appointments: { none: {} } },
        {
          AND: [
            { appointments: { some: {} } },
            {
              appointments: {
                none: {
                  status: {
                    in: ['SCHEDULED', 'COMPLETED', 'PENDING'],
                  },
                },
              },
            },
          ],
        },
      ]
    }

    // Debug: Log the where clause to verify the query
    console.log('Timeslot query where clause:', JSON.stringify(where, null, 2))

    const [timeSlots, total] = await Promise.all([
      prisma.appointment_Slot.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ slot_date: 'asc' }, { start_time: 'asc' }],
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          appointments: {
            select: {
              id: true,
              status: true,
              appointment_date: true,
              appointment_time: true,
              patient: {
                include: {
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
          },
          _count: {
            select: {
              appointments: true,
            },
          },
        },
      }),
      prisma.appointment_Slot.count({ where }),
    ])

    return {
      timeslots: timeSlots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  getById: async (id: string) => {
    const timeSlot = await prisma.appointment_Slot.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            clinic: {
              include: {
                address: true,
              },
            },
          },
        },
        appointments: {
          select: {
            id: true,
            status: true,
            appointment_date: true,
            appointment_time: true,
            patient: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            service: {
              select: {
                id: true,
                service_name: true,
              },
            },
          },
        },
      },
    })

    if (!timeSlot) {
      throw new HttpError('Time slot not found', HttpStatusCodes.NOT_FOUND)
    }

    return timeSlot
  },

  getByDoctorId: async (doctorId: string, filters: Omit<TimeSlotFilters, 'doctorId' | 'userId'> = {}) => {
    return TIME_SLOT_SERVICES.getAll({
      ...filters,
      doctorId,
    })
  },

  getByUserId: async (userId: string, filters: Omit<TimeSlotFilters, 'userId' | 'doctorId'> = {}) => {
    return TIME_SLOT_SERVICES.getAll({
      ...filters,
      userId,
    })
  },

  update: async (id: string, data: UpdateTimeSlotData, doctorId: string) => {
    const existingTimeSlot = await prisma.appointment_Slot.findUnique({
      where: { id },
    })

    if (!existingTimeSlot) {
      throw new HttpError('Time slot not found', HttpStatusCodes.NOT_FOUND)
    }

    // Verify the doctor owns this time slot
    if (existingTimeSlot.doctor_id !== doctorId) {
      throw new HttpError('Unauthorized to update this time slot', HttpStatusCodes.FORBIDDEN)
    }

    const updateData: any = {}

    if (data.slotDate) {
      updateData.slot_date = data.slotDate
    }
    if (data.startTime) {
      updateData.start_time = data.startTime
    }
    if (data.endTime) {
      updateData.end_time = data.endTime
    }
    if (data.isAvailable !== undefined) {
      updateData.is_available = data.isAvailable
    }
    if (data.consultationType) {
      updateData.consultation_type = data.consultationType
    }

    // Use existing values if not provided
    const slotDate = updateData.slot_date || existingTimeSlot.slot_date
    const startTime = updateData.start_time || existingTimeSlot.start_time
    const endTime = updateData.end_time || existingTimeSlot.end_time

    // Validate time slot logic
    if (startTime >= endTime) {
      throw new HttpError('Start time must be before end time', HttpStatusCodes.BAD_REQUEST)
    }

    // Parse slot date for comparison
    const slotDateStart = new Date(slotDate)
    slotDateStart.setHours(0, 0, 0, 0)
    const slotDateEnd = new Date(slotDate)
    slotDateEnd.setHours(23, 59, 59, 999)

    // Check for overlapping time slots (excluding current slot)
    const overlappingSlot = await prisma.appointment_Slot.findFirst({
      where: {
        doctor_id: existingTimeSlot.doctor_id,
        id: { not: id },
        slot_date: {
          gte: slotDateStart,
          lte: slotDateEnd,
        },
        OR: [
          {
            AND: [
              { start_time: { lte: startTime } },
              { end_time: { gt: startTime } },
            ],
          },
          {
            AND: [
              { start_time: { lt: endTime } },
              { end_time: { gte: endTime } },
            ],
          },
          {
            AND: [
              { start_time: { gte: startTime } },
              { end_time: { lte: endTime } },
            ],
          },
        ],
      },
    })

    if (overlappingSlot) {
      throw new HttpError('Updated time slot overlaps with existing slot', HttpStatusCodes.CONFLICT)
    }

    try {
      const timeSlot = await prisma.appointment_Slot.update({
        where: { id },
        data: updateData,
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          appointments: {
            select: {
              id: true,
              status: true,
              appointment_date: true,
              appointment_time: true,
            },
          },
        },
      })

      return timeSlot
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string }
        if (prismaError.code === 'P2002') {
          throw new HttpError('Time slot already exists for this doctor', HttpStatusCodes.CONFLICT)
        }
      }
      throw error
    }
  },

  delete: async (id: string, doctorId: string) => {
    const existingTimeSlot = await prisma.appointment_Slot.findUnique({
      where: { id },
      include: {
        appointments: {
          where: {
            status: { in: ['SCHEDULED', 'PENDING'] },
          },
        },
      },
    })

    if (!existingTimeSlot) {
      throw new HttpError('Time slot not found', HttpStatusCodes.NOT_FOUND)
    }

    // Verify the doctor owns this time slot
    if (existingTimeSlot.doctor_id !== doctorId) {
      throw new HttpError('Unauthorized to delete this time slot', HttpStatusCodes.FORBIDDEN)
    }

    // Check if there are active appointments
    if (existingTimeSlot.appointments.length > 0) {
      throw new HttpError(
        'Cannot delete time slot with active appointments',
        HttpStatusCodes.CONFLICT
      )
    }

    return await prisma.appointment_Slot.delete({
      where: { id },
    })
  },

  deleteAll: async (doctorId: string) => {
    // Get all timeslots for this doctor that have no active appointments
    const timeslotsToDelete = await prisma.appointment_Slot.findMany({
      where: {
        doctor_id: doctorId,
        appointments: {
          none: {
            status: {
              in: ['SCHEDULED', 'PENDING'],
            },
          },
        },
      },
    })

    if (timeslotsToDelete.length === 0) {
      return { deleted: 0, skipped: 0 }
    }

    // Get count of timeslots with active appointments (for reporting)
    const timeslotsWithAppointments = await prisma.appointment_Slot.count({
      where: {
        doctor_id: doctorId,
        appointments: {
          some: {
            status: {
              in: ['SCHEDULED', 'PENDING'],
            },
          },
        },
      },
    })

    // Delete all timeslots without active appointments
    const deleteResult = await prisma.appointment_Slot.deleteMany({
      where: {
        doctor_id: doctorId,
        appointments: {
          none: {
            status: {
              in: ['SCHEDULED', 'PENDING'],
            },
          },
        },
      },
    })

    return {
      deleted: deleteResult.count,
      skipped: timeslotsWithAppointments,
    }
  },

  getAvailableSlots: async (doctorId?: string, startDate?: Date, endDate?: Date) => {
    return TIME_SLOT_SERVICES.getAll({
      doctorId,
      startDate,
      endDate,
      available: true,
    })
  },

  bulkCreate: async (slots: CreateTimeSlotData[]) => {
    await validateBulkCreateSlots(slots)

    try {
      const createdSlots = await Promise.all(
        slots.map(slot =>
          prisma.appointment_Slot.create({
            data: {
              doctor_id: slot.doctorId,
              slot_date: slot.slotDate,
              start_time: slot.startTime,
              end_time: slot.endTime,
              is_available: slot.isAvailable ?? true,
              consultation_type: slot.consultationType ?? 'BOTH',
            },
            include: {
              doctor: {
                include: {
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
        )
      )

      return {
        created: createdSlots,
        errors: [],
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string }
        if (prismaError.code === 'P2002') {
          throw new HttpError(
            'Some time slots already exist for this doctor',
            HttpStatusCodes.CONFLICT
          )
        }
      }
      throw error
    }
  },
}

// Helper function to validate bulk create slots
async function validateBulkCreateSlots(slots: CreateTimeSlotData[]) {
  // Validate all slots belong to the same doctor for simplicity
  const doctorIds = Array.from(new Set(slots.map(slot => slot.doctorId)))
  if (doctorIds.length !== 1) {
    throw new HttpError(
      'All time slots must belong to the same doctor',
      HttpStatusCodes.BAD_REQUEST
    )
  }

  const doctorId = doctorIds[0]

  // Validate that the doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  })

  if (!doctor) {
    throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
  }

  // Validate time slot logic for each slot
  for (const slot of slots) {
    if (slot.startTime >= slot.endTime) {
      throw new HttpError(
        `Invalid time range for slot: ${slot.startTime} - ${slot.endTime}`,
        HttpStatusCodes.BAD_REQUEST
      )
    }
  }

  // Check for overlapping slots within the batch
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slot1 = slots[i]
      const slot2 = slots[j]

      // Check if same date
      const date1 = new Date(slot1.slotDate).toDateString()
      const date2 = new Date(slot2.slotDate).toDateString()

      if (date1 === date2 && slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime) {
        throw new HttpError(`Overlapping slots detected in batch`, HttpStatusCodes.BAD_REQUEST)
      }
    }
  }
}
