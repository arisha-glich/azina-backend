import * as HttpStatusCodes from 'stoker/http-status-codes'
import { patientService } from '~/services/patient.service'
import { bookingService } from '~/services/booking.service'
import type { BOOKING_ROUTES } from '~/routes/patient/booking/booking.routes'
import type { HandlerMapFromRoutes } from '~/types'

export const BOOKING_ROUTE_HANDLER: HandlerMapFromRoutes<typeof BOOKING_ROUTES> = {
  get_services_for_booking: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const query = c.req.valid('query')
      const filters: any = {}

      if (query.city || query.state || query.country) {
        filters.location = {}
        if (query.city) filters.location.city = query.city
        if (query.state) filters.location.state = query.state
        if (query.country) filters.location.country = query.country
      }

      if (query.offerAsProduct !== undefined) {
        filters.offerAsProduct = query.offerAsProduct
      }

      if (query.clinicId) {
        filters.clinicId = query.clinicId
      }

      if (query.doctorId) {
        filters.doctorId = query.doctorId
      }

      const services = await bookingService.getServicesWithConditions(filters)

      return c.json(
        {
          message: 'Services retrieved successfully',
          success: true,
          data: {
            services,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving services:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_doctors_by_service: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const { serviceId } = c.req.valid('param')
      const query = c.req.valid('query')

      const filters: any = {}
      if (query.city || query.state || query.country) {
        filters.location = {}
        if (query.city) filters.location.city = query.city
        if (query.state) filters.location.state = query.state
        if (query.country) filters.location.country = query.country
      }

      const result = await bookingService.getDoctorsByService(serviceId, filters)

      if (!result) {
        return c.json(
          { message: 'Service not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Doctors retrieved successfully',
          success: true,
          data: result,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving doctors:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_doctor_details_with_timeslots: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const { doctorId } = c.req.valid('param')
      const query = c.req.valid('query')

      const filters: any = {}
      if (query.date) {
        filters.date = query.date
      }
      if (query.isAvailable !== undefined) {
        filters.isAvailable = query.isAvailable
      }
      if (query.consultationType) {
        filters.consultationType = query.consultationType
      }

      const doctor = await bookingService.getDoctorDetailsWithTimeslots(doctorId, filters)

      if (!doctor) {
        return c.json(
          { message: 'Doctor not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Doctor details retrieved successfully',
          success: true,
          data: doctor,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving doctor details:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  add_to_cart: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Get patient ID
      const patient = await patientService.getPatientProfile(userId)
      if (!patient) {
        return c.json(
          { message: 'Patient profile not found', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      const { serviceId, quantity } = c.req.valid('json')

      const cartItem = await bookingService.addToCart(patient.patient.id, serviceId, quantity)

      return c.json(
        {
          message: 'Item added to cart successfully',
          success: true,
          data: cartItem,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error adding to cart:', error)
      const errorMessage = error instanceof Error ? error.message : 'Internal server error'
      return c.json(
        { message: errorMessage, success: false },
        errorMessage.includes('not found') || errorMessage.includes('does not have')
          ? HttpStatusCodes.BAD_REQUEST
          : HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_cart: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Get patient ID
      const patient = await patientService.getPatientProfile(userId)
      if (!patient) {
        return c.json(
          { message: 'Patient profile not found', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      const cartItems = await bookingService.getCart(patient.patient.id)

      return c.json(
        {
          message: 'Cart retrieved successfully',
          success: true,
          data: {
            cartItems,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving cart:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  remove_from_cart: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Get patient ID
      const patient = await patientService.getPatientProfile(userId)
      if (!patient) {
        return c.json(
          { message: 'Patient profile not found', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      const { cartItemId } = c.req.valid('param')

      const cartItem = await bookingService.removeFromCart(patient.patient.id, cartItemId)

      if (!cartItem) {
        return c.json(
          { message: 'Cart item not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Item removed from cart successfully',
          success: true,
          data: cartItem,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error removing from cart:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_cart_quantity: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Get patient ID
      const patient = await patientService.getPatientProfile(userId)
      if (!patient) {
        return c.json(
          { message: 'Patient profile not found', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      const { cartItemId } = c.req.valid('param')
      const { quantity } = c.req.valid('json')

      const cartItem = await bookingService.updateCartQuantity(patient.patient.id, cartItemId, quantity)

      if (!cartItem) {
        return c.json(
          { message: 'Cart item not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Cart item quantity updated successfully',
          success: true,
          data: cartItem,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating cart quantity:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}

