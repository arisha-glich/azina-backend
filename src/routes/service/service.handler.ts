import { clinicService } from '~/services/clinic.service'
import { doctorService } from '~/services/doctor.service'
import { serviceService } from '~/services/service.service'
import type { SERVICE_ROUTES } from '~/routes/service/service.routes'
import type { HandlerMapFromRoutes } from '~/types'

type ErrorStatus = 401 | 403
type OwnerResolution =
  | { success: true; owner: { clinicId?: string; doctorId?: string } }
  | { success: false; status: ErrorStatus; message: string }

async function resolveOwner(c: Parameters<HandlerMapFromRoutes<typeof SERVICE_ROUTES>[keyof typeof SERVICE_ROUTES]>[0]): Promise<OwnerResolution> {
  const sessionUser = c.get('user')

  if (!sessionUser?.id) {
    return { success: false, status: 401, message: 'Unauthorized' }
  }

  const role = sessionUser.role?.toString().trim().toUpperCase()

  if (role === 'CLINIC') {
    const clinic = await clinicService.getClinicByUserId(sessionUser.id)

    if (!clinic) {
      return {
        success: false,
        status: 403,
        message: 'Clinic profile not found for the authenticated user.',
      }
    }

    return { success: true, owner: { clinicId: clinic.id } }
  }

  if (role === 'DOCTOR') {
    const doctor = await doctorService.getDoctorByUserId(sessionUser.id)

    if (!doctor) {
      return {
        success: false,
        status: 403,
        message: 'Doctor profile not found for the authenticated user.',
      }
    }

    if (doctor.clinic_id) {
      return {
        success: false,
        status: 403,
        message:
          'Doctors linked to a clinic should manage services through the clinic account. Please contact your clinic administrator.',
      }
    }

    return { success: true, owner: { doctorId: doctor.id } }
  }

  return {
    success: false,
    status: 403,
    message: 'Only clinic or standalone doctor accounts can manage services.',
  }
}

export const SERVICE_ROUTE_HANDLER: HandlerMapFromRoutes<typeof SERVICE_ROUTES> = {
  list_services: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const services = await serviceService.listServices(resolution.owner)

      return c.json(
        {
          message: 'Services retrieved successfully',
          success: true,
          data: {
            services,
          },
        },
        200
      )
    } catch (error) {
      console.error('Error listing services:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },

  create_service: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const payload = c.req.valid('json')
      const { conditions = [], ...serviceData } = payload

      const service = await serviceService.createService(serviceData, resolution.owner, conditions)

      return c.json(
        {
          message: 'Service created successfully',
          success: true,
          data: service,
        },
        201
      )
    } catch (error) {
      console.error('Error creating service:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },

  get_service_by_id: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const { serviceId } = c.req.valid('param')
      const service = await serviceService.getServiceById(serviceId, resolution.owner)

      if (!service) {
        return c.json({ message: 'Service not found', success: false }, 404)
      }

      return c.json(
        {
          message: 'Service retrieved successfully',
          success: true,
          data: service,
        },
        200
      )
    } catch (error) {
      console.error('Error retrieving service:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },

  update_service: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const { serviceId } = c.req.valid('param')
      const payload = c.req.valid('json')

      const service = await serviceService.updateService(serviceId, resolution.owner, payload)

      if (!service) {
        return c.json({ message: 'Service not found', success: false }, 404)
      }

      return c.json(
        {
          message: 'Service updated successfully',
          success: true,
          data: service,
        },
        200
      )
    } catch (error) {
      console.error('Error updating service:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },

  delete_service: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const { serviceId } = c.req.valid('param')

      const service = await serviceService.deleteService(serviceId, resolution.owner)

      if (!service) {
        return c.json({ message: 'Service not found', success: false }, 404)
      }

      return c.json(
        {
          message: 'Service deleted successfully',
          success: true,
          data: service,
        },
        200
      )
    } catch (error) {
      console.error('Error deleting service:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },

  list_conditions: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const { serviceId } = c.req.valid('param')
      const conditions = await serviceService.listConditions(serviceId, resolution.owner)

      if (!conditions) {
        return c.json({ message: 'Service not found', success: false }, 404)
      }

      return c.json(
        {
          message: 'Service conditions retrieved successfully',
          success: true,
          data: {
            conditions,
          },
        },
        200
      )
    } catch (error) {
      console.error('Error listing service conditions:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },

  create_condition: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const { serviceId } = c.req.valid('param')
      const payload = c.req.valid('json')

      const condition = await serviceService.createCondition(serviceId, resolution.owner, payload)

      if (!condition) {
        return c.json({ message: 'Service not found', success: false }, 404)
      }

      return c.json(
        {
          message: 'Service condition created successfully',
          success: true,
          data: condition,
        },
        201
      )
    } catch (error) {
      console.error('Error creating service condition:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },

  update_condition: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const { serviceId, conditionId } = c.req.valid('param')
      const payload = c.req.valid('json')

      const condition = await serviceService.updateCondition(
        serviceId,
        conditionId,
        resolution.owner,
        payload
      )

      if (!condition) {
        return c.json({ message: 'Service or condition not found', success: false }, 404)
      }

      return c.json(
        {
          message: 'Service condition updated successfully',
          success: true,
          data: condition,
        },
        200
      )
    } catch (error) {
      console.error('Error updating service condition:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },

  delete_condition: async c => {
    try {
      const resolution = await resolveOwner(c)

      if (!resolution.success) {
        return c.json({ message: resolution.message, success: false }, resolution.status)
      }

      const { serviceId, conditionId } = c.req.valid('param')

      const condition = await serviceService.deleteCondition(serviceId, conditionId, resolution.owner)

      if (!condition) {
        return c.json({ message: 'Service or condition not found', success: false }, 404)
      }

      return c.json(
        {
          message: 'Service condition deleted successfully',
          success: true,
          data: condition,
        },
        200
      )
    } catch (error) {
      console.error('Error deleting service condition:', error)
      return c.json({ message: 'Internal server error', success: false }, 500)
    }
  },
}

