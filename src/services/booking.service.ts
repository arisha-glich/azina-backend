import prisma from '~/lib/prisma'

type ServiceFilter = {
  location?: {
    city?: string
    state?: string
    country?: string
  }
  offerAsProduct?: boolean // Filter by whether service conditions are products or consultations
  clinicId?: string
  doctorId?: string
}

export const bookingService = {
  /**
   * Get all services with their conditions, filtered by location and product/consultation type
   */
  async getServicesWithConditions(filters?: ServiceFilter) {
    const where: any = {}

    // Filter by clinic or doctor
    if (filters?.clinicId) {
      where.clinic_id = filters.clinicId
    } else if (filters?.doctorId) {
      where.doctor_id = filters.doctorId
    }

    // Filter by location if provided
    if (filters?.location) {
      const locationWhere: any = {}
      if (filters.location.city) {
        locationWhere.city = { contains: filters.location.city, mode: 'insensitive' }
      }
      if (filters.location.state) {
        locationWhere.state = { contains: filters.location.state, mode: 'insensitive' }
      }
      if (filters.location.country) {
        locationWhere.country = { contains: filters.location.country, mode: 'insensitive' }
      }

      if (Object.keys(locationWhere).length > 0) {
        where.OR = [
          {
            clinic: {
              address: locationWhere,
            },
          },
          {
            doctor: {
              clinic: {
                address: locationWhere,
              },
            },
          },
        ]
      }
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        conditions: true,
        clinic: {
          include: {
            address: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            clinic: {
              include: {
                address: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter by offer_as_product if specified
    let filteredServices = services
    if (filters?.offerAsProduct !== undefined) {
      filteredServices = services.map(service => ({
        ...service,
        conditions: service.conditions.filter(
          condition => condition.offer_as_product === filters.offerAsProduct
        ),
      })).filter(service => service.conditions.length > 0)
    }

    return filteredServices
  },

  /**
   * Get doctors who offer a specific service (for consultation flow)
   */
  async getDoctorsByService(serviceId: string, filters?: { location?: ServiceFilter['location'] }) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        conditions: {
          where: {
            offer_as_product: false, // Only consultation services
          },
        },
      },
    })

    if (!service) {
      return null
    }

    // If service has no consultation conditions, return empty
    if (service.conditions.length === 0) {
      return {
        service,
        doctors: [],
      }
    }

    const where: any = {
      services: {
        some: {
          id: serviceId,
        },
      },
      user: {
        onboarding_stage: 'APPROVED_BY_ADMIN',
      },
    }

    // Filter by location if provided
    if (filters?.location) {
      const locationWhere: any = {}
      if (filters.location.city) {
        locationWhere.city = { contains: filters.location.city, mode: 'insensitive' }
      }
      if (filters.location.state) {
        locationWhere.state = { contains: filters.location.state, mode: 'insensitive' }
      }
      if (filters.location.country) {
        locationWhere.country = { contains: filters.location.country, mode: 'insensitive' }
      }

      if (Object.keys(locationWhere).length > 0) {
        where.OR = [
          {
            clinic: {
              address: locationWhere,
            },
          },
          // For standalone doctors, we might need to check their clinic association
        ]
      }
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone_no: true,
          },
        },
        clinic: {
          include: {
            address: true,
          },
        },
        services: {
          where: {
            id: serviceId,
          },
          include: {
            conditions: {
              where: {
                offer_as_product: false,
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate average rating for each doctor
    const doctorsWithRating = doctors.map(doctor => {
      const ratings = doctor.reviews.map(r => r.rating)
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0

      return {
        ...doctor,
        averageRating: avgRating,
        totalReviews: ratings.length,
        reviews: undefined, // Remove reviews array from response
      }
    })

    return {
      service,
      doctors: doctorsWithRating,
    }
  },

  /**
   * Get doctor details with available timeslots
   */
  async getDoctorDetailsWithTimeslots(
    doctorId: string,
    filters?: {
      date?: string // ISO date string
      isAvailable?: boolean
      consultationType?: 'BOTH' | 'IN_PERSON' | 'VIDEO_CALL'
    }
  ) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone_no: true,
            dob: true,
            gender: true,
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
        services: {
          include: {
            conditions: {
              where: {
                offer_as_product: false, // Only consultation conditions
              },
            },
          },
        },
        reviews: {
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Latest 10 reviews
        },
        appointment_slots: {
          where: {
            ...(filters?.date
              ? {
                  slot_date: {
                    gte: new Date(filters.date),
                    lt: new Date(new Date(filters.date).setDate(new Date(filters.date).getDate() + 1)),
                  },
                }
              : {
                  slot_date: {
                    gte: new Date(), // Only future slots
                  },
                }),
            ...(filters?.isAvailable !== undefined ? { is_available: filters.isAvailable } : {}),
            ...(filters?.consultationType ? { consultation_type: filters.consultationType } : {}),
          },
          orderBy: [
            {
              slot_date: 'asc',
            },
            {
              start_time: 'asc',
            },
          ],
        },
      },
    })

    if (!doctor) {
      return null
    }

    // Calculate average rating
    const ratings = doctor.reviews.map(r => r.rating)
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0

    return {
      ...doctor,
      averageRating: avgRating,
      totalReviews: ratings.length,
    }
  },

  /**
   * Add service to cart (for products)
   */
  async addToCart(patientId: string, serviceId: string, quantity: number = 1) {
    // Verify service exists and has product conditions
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        conditions: {
          where: {
            offer_as_product: true,
          },
        },
      },
    })

    if (!service) {
      throw new Error('Service not found')
    }

    if (service.conditions.length === 0) {
      throw new Error('Service does not have product conditions')
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cart.findUnique({
      where: {
        patient_id_service_id: {
          patient_id: patientId,
          service_id: serviceId,
        },
      },
    })

    if (existingCartItem) {
      // Update quantity
      return prisma.cart.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
          updatedAt: new Date(),
        },
        include: {
          service: {
            include: {
              conditions: true,
            },
          },
        },
      })
    }

    // Create new cart item
    return prisma.cart.create({
      data: {
        patient_id: patientId,
        service_id: serviceId,
        quantity,
      },
      include: {
        service: {
          include: {
            conditions: true,
          },
        },
      },
    })
  },

  /**
   * Get patient cart items
   */
  async getCart(patientId: string) {
    return prisma.cart.findMany({
      where: { patient_id: patientId },
      include: {
        service: {
          include: {
            conditions: {
              where: {
                offer_as_product: true,
              },
            },
            clinic: {
              include: {
                address: true,
              },
            },
            doctor: {
              include: {
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
        },
      },
      orderBy: {
        added_at: 'desc',
      },
    })
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(patientId: string, cartItemId: string) {
    const cartItem = await prisma.cart.findFirst({
      where: {
        id: cartItemId,
        patient_id: patientId,
      },
    })

    if (!cartItem) {
      return null
    }

    return prisma.cart.delete({
      where: { id: cartItemId },
    })
  },

  /**
   * Update cart item quantity
   */
  async updateCartQuantity(patientId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(patientId, cartItemId)
    }

    const cartItem = await prisma.cart.findFirst({
      where: {
        id: cartItemId,
        patient_id: patientId,
      },
    })

    if (!cartItem) {
      return null
    }

    return prisma.cart.update({
      where: { id: cartItemId },
      data: {
        quantity,
        updatedAt: new Date(),
      },
      include: {
        service: {
          include: {
            conditions: true,
          },
        },
      },
    })
  },
}

