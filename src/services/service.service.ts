import prisma from '~/lib/prisma'

type ServiceOwner = {
  clinicId?: string
  doctorId?: string
}

type ServicePayload = {
  service_name: string
  description?: string | null
}

type ServiceConditionPayload = {
  name: string
  description?: string | null
  price: number
  offer_as_product?: boolean
}

function ensureOwner(owner: ServiceOwner) {
  if (!owner.clinicId && !owner.doctorId) {
    throw new Error('Either clinicId or doctorId must be provided')
  }
}

const prismaClient = prisma as any
const serviceInclude = { conditions: true } as const

export const serviceService = {
  async listServices(owner: ServiceOwner) {
    ensureOwner(owner)

    return prismaClient.service.findMany({
      where: {
        ...(owner.clinicId ? { clinic_id: owner.clinicId } : {}),
        ...(owner.doctorId ? { doctor_id: owner.doctorId } : {}),
      },
      include: serviceInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  async getServiceById(serviceId: string, owner: ServiceOwner) {
    ensureOwner(owner)

    return prismaClient.service.findFirst({
      where: {
        id: serviceId,
        ...(owner.clinicId ? { clinic_id: owner.clinicId } : {}),
        ...(owner.doctorId ? { doctor_id: owner.doctorId } : {}),
      },
      include: serviceInclude,
    })
  },

  async createService(payload: ServicePayload, owner: ServiceOwner, conditions?: ServiceConditionPayload[]) {
    ensureOwner(owner)

    return prismaClient.service.create({
      data: {
        service_name: payload.service_name,
        description: payload.description ?? null,
        conditions_count: conditions?.length ?? 0,
        clinic_id: owner.clinicId ?? null,
        doctor_id: owner.doctorId ?? null,
        ...(conditions && conditions.length
          ? {
              conditions: {
                create: conditions.map(condition => ({
                  name: condition.name,
                  description: condition.description ?? null,
                  price: condition.price,
                  offer_as_product: condition.offer_as_product ?? false,
                })),
              },
            }
          : {}),
      },
      include: serviceInclude,
    })
  },

  async updateService(
    serviceId: string,
    owner: ServiceOwner,
    payload: Partial<ServicePayload>
  ) {
    ensureOwner(owner)

    const existing = await serviceService.getServiceById(serviceId, owner)

    if (!existing) {
      return null
    }

    return prismaClient.service.update({
      where: { id: serviceId },
      data: {
        ...(payload.service_name !== undefined ? { service_name: payload.service_name } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
      },
      include: serviceInclude,
    })
  },

  async deleteService(serviceId: string, owner: ServiceOwner) {
    ensureOwner(owner)

    const existing = await serviceService.getServiceById(serviceId, owner)

    if (!existing) {
      return null
    }

    await prismaClient.service.delete({
      where: { id: serviceId },
    })

    return existing
  },

  async listConditions(serviceId: string, owner: ServiceOwner) {
    const service = await serviceService.getServiceById(serviceId, owner)

    if (!service) {
      return null
    }

    return service.conditions
  },

  async createCondition(
    serviceId: string,
    owner: ServiceOwner,
    payload: ServiceConditionPayload
  ) {
    const service = await serviceService.getServiceById(serviceId, owner)

    if (!service) {
      return null
    }

    const [condition] = await prismaClient.$transaction([
      prismaClient.serviceCondition.create({
        data: {
          service_id: service.id,
          name: payload.name,
          description: payload.description ?? null,
          price: payload.price,
          offer_as_product: payload.offer_as_product ?? false,
        },
      }),
      prismaClient.service.update({
        where: { id: service.id },
        data: {
          conditions_count: { increment: 1 },
        },
      }),
    ])

    return condition
  },

  async updateCondition(
    serviceId: string,
    conditionId: string,
    owner: ServiceOwner,
    payload: Partial<ServiceConditionPayload>
  ) {
    const service = await serviceService.getServiceById(serviceId, owner)

    if (!service) {
      return null
    }

    const condition = await prismaClient.serviceCondition.findFirst({
      where: {
        id: conditionId,
        service_id: service.id,
      },
    })

    if (!condition) {
      return null
    }

    const updatedCondition = await prismaClient.serviceCondition.update({
      where: { id: conditionId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.price !== undefined ? { price: payload.price } : {}),
        ...(payload.offer_as_product !== undefined
          ? { offer_as_product: payload.offer_as_product }
          : {}),
      },
    })

    return updatedCondition
  },

  async deleteCondition(serviceId: string, conditionId: string, owner: ServiceOwner) {
    const service = await serviceService.getServiceById(serviceId, owner)

    if (!service) {
      return null
    }

    const condition = await prismaClient.serviceCondition.findFirst({
      where: {
        id: conditionId,
        service_id: service.id,
      },
    })

    if (!condition) {
      return null
    }

    await prismaClient.$transaction([
      prismaClient.serviceCondition.delete({
        where: { id: conditionId },
      }),
      prismaClient.service.update({
        where: { id: service.id },
        data:
          service.conditions_count && service.conditions_count > 0
            ? {
                conditions_count: { decrement: 1 },
              }
            : {
                conditions_count: { set: 0 },
              },
      }),
    ])

    return condition
  },
}

