import prisma from '~/lib/prisma'

// biome-ignore lint/suspicious/noExplicitAny: Request entity can be doctor or clinic type
async function attachEntity(req: any) {
  if (!req) {
    return req
  }
  if (req.request_type === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.entity_id },
      include: { user: true, clinic: true },
    })
    return { ...req, entity: doctor }
  }
  if (req.request_type === 'CLINIC') {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.entity_id },
      include: { doctors: true, address: true },
    })
    return { ...req, entity: clinic }
  }
  return req
}

export const approvalService = {
  // Create a new approval request
  async createRequest(
    userId: string,
    requestType: 'DOCTOR' | 'CLINIC',
    entityId: string,
    // biome-ignore lint/suspicious/noExplicitAny: Request data can have various shapes depending on request type
    requestData: any
  ) {
    // Check if there's already a pending request for this entity
    const existingPending = await prisma.approvalRequest.findFirst({
      where: { user_id: userId, entity_id: entityId, request_type: requestType, status: 'PENDING' },
    })

    if (existingPending) {
      const updated = await prisma.approvalRequest.update({
        where: { id: existingPending.id },
        data: { request_data: requestData, updatedAt: new Date() },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      })
      return attachEntity(updated)
    }

    const created = await prisma.approvalRequest.create({
      data: {
        request_type: requestType,
        user_id: userId,
        entity_id: entityId,
        request_data: requestData,
        status: 'PENDING',
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
    return attachEntity(created)
  },

  // Get all pending requests (for admin)
  // Admin should ONLY see requests WITHOUT clinic_id (requests not assigned to any clinic)
  async getAllPendingRequests() {
    const items = await prisma.approvalRequest.findMany({
      where: {
        status: 'PENDING',
        clinic_id: null, // Only requests without clinic_id
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, onboarding_stage: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return await Promise.all(items.map(attachEntity))
  },

  // Get all requests with filter (for admin)
  // Admin should ONLY see requests WITHOUT clinic_id (requests not assigned to any clinic)
  async getAllRequests(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    // biome-ignore lint/suspicious/noExplicitAny: Prisma where clause can have dynamic structure
    const where: any = {
      clinic_id: null, // Only requests without clinic_id
    }
    if (status) {
      where.status = status
    }

    const items = await prisma.approvalRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, onboarding_stage: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return await Promise.all(items.map(attachEntity))
  },

  // Get request by user ID (for doctor/clinic to see their status)
  async getRequestByUserId(userId: string) {
    const req = await prisma.approvalRequest.findFirst({
      where: { user_id: userId, status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return attachEntity(req)
  },

  // Get request by ID
  async getRequestById(requestId: string) {
    const req = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            onboarding_stage: true,
            image: true,
            phone_no: true,
            gender: true,
            dob: true,
            banned: true,
            banReason: true,
            banExpiresAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })
    return attachEntity(req)
  },

  // Approve a request
  async approveRequest(requestId: string, adminUserId: string) {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } })
    if (!request) {
      return null
    }

    const updatedRequest = await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', reviewed_by: adminUserId, reviewed_at: new Date() },
      include: { user: true },
    })
    await prisma.user.update({
      where: { id: request.user_id },
      data: { onboarding_stage: 'APPROVED_BY_ADMIN' },
    })
    return attachEntity(updatedRequest)
  },

  // Reject a request
  async rejectRequest(requestId: string, adminUserId: string, rejectionReason: string) {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } })
    if (!request) {
      return null
    }

    const updatedRequest = await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejection_reason: rejectionReason,
        reviewed_by: adminUserId,
        reviewed_at: new Date(),
      },
      include: { user: true },
    })
    await prisma.user.update({
      where: { id: request.user_id },
      data: { onboarding_stage: 'REJECTED' },
    })
    return attachEntity(updatedRequest)
  },

  async getUserRequests(userId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    // biome-ignore lint/suspicious/noExplicitAny: Prisma where clause can have dynamic structure
    const where: any = { user_id: userId }
    if (status) {
      where.status = status
    }
    const items = await prisma.approvalRequest.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return await Promise.all(items.map(attachEntity))
  },

  async getLatestUserRequest(userId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    // biome-ignore lint/suspicious/noExplicitAny: Prisma where clause can have dynamic structure
    const where: any = { user_id: userId }
    if (status) {
      where.status = status
    }
    const req = await prisma.approvalRequest.findFirst({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return attachEntity(req)
  },

  // Create a clinic-specific approval request for doctor
  async createClinicRequest(
    userId: string,
    entityId: string,
    // biome-ignore lint/suspicious/noExplicitAny: Request data can have various shapes
    requestData: any,
    clinicId: string
  ) {
    // Check if there's already a pending request for this entity and clinic
    const existingPending = await prisma.approvalRequest.findFirst({
      where: {
        user_id: userId,
        entity_id: entityId,
        request_type: 'DOCTOR',
        clinic_id: clinicId,
        status: 'PENDING',
      },
    })

    if (existingPending) {
      const updated = await prisma.approvalRequest.update({
        where: { id: existingPending.id },
        data: { request_data: requestData, updatedAt: new Date() },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      })
      return attachEntity(updated)
    }

    const created = await prisma.approvalRequest.create({
      data: {
        request_type: 'DOCTOR',
        user_id: userId,
        entity_id: entityId,
        clinic_id: clinicId,
        request_data: requestData,
        status: 'PENDING',
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
    return attachEntity(created)
  },

  // Get all requests for a specific clinic
  // Returns ONLY DOCTOR requests where the doctor is associated with the clinic via clinic_id
  // This endpoint should NEVER return CLINIC type requests
  async getClinicRequests(clinicId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    console.log('[getClinicRequests] Called with:', {
      clinicId,
      status,
      clinicIdType: typeof clinicId,
    })

    // DEBUG: Check what requests exist for this clinic_id
    const debugRequests = await prisma.approvalRequest.findMany({
      where: { clinic_id: clinicId },
      select: {
        id: true,
        request_type: true,
        clinic_id: true,
        status: true,
        user_id: true,
      },
    })
    console.log(
      '[getClinicRequests] DEBUG - All requests with clinic_id =',
      clinicId,
      ':',
      debugRequests
    )

    // Strictly filter: MUST be DOCTOR type AND have clinic_id matching
    // Explicitly exclude CLINIC requests
    // biome-ignore lint/suspicious/noExplicitAny: Prisma where clause can have dynamic structure
    const where: any = {
      request_type: 'DOCTOR', // ONLY DOCTOR requests - never CLINIC
      clinic_id: clinicId, // MUST have clinic_id matching
      NOT: {
        request_type: 'CLINIC', // Explicitly exclude CLINIC requests
      },
    }

    if (status) {
      where.status = status
    }

    console.log('[getClinicRequests] Query params:', { clinicId, status, where })

    // Get ONLY DOCTOR requests with clinic_id matching
    const items = await prisma.approvalRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            onboarding_stage: true,
            phone_no: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log('[getClinicRequests] Found requests:', items.length)
    console.log(
      '[getClinicRequests] Request details:',
      items.map(i => ({
        id: i.id,
        request_type: i.request_type,
        clinic_id: i.clinic_id,
        status: i.status,
        user_email: i.user.email,
      }))
    )

    // attachEntity will add the doctor entity with user and clinic info
    const results = await Promise.all(items.map(attachEntity))

    // STRICT filtering: Ensure ONLY DOCTOR requests with valid doctor entity are returned
    const filtered = results.filter(req => {
      if (!req) {
        return false
      }

      // MUST be DOCTOR type - reject CLINIC requests
      if (req.request_type !== 'DOCTOR') {
        console.warn(
          '[getClinicRequests] ❌ Rejecting non-DOCTOR request:',
          req.id,
          'type:',
          req.request_type
        )
        return false
      }

      // MUST have clinic_id matching in approval_request
      if (req.clinic_id !== clinicId) {
        console.warn(
          '[getClinicRequests] ❌ Rejecting request with mismatched clinic_id:',
          req.id,
          'clinic_id:',
          req.clinic_id,
          'expected:',
          clinicId
        )
        return false
      }

      // MUST have a doctor entity (not a clinic entity)
      if (!req.entity) {
        console.warn('[getClinicRequests] ❌ Rejecting request without entity:', req.id)
        return false
      }

      // Entity MUST be a doctor (check if it has doctor-specific fields, not clinic fields)
      // Doctors have: specialization, license_number
      // Clinics have: clinic_name (but clinics shouldn't be here anyway)
      if (!req.entity.specialization && !req.entity.license_number) {
        console.warn(
          '[getClinicRequests] ❌ Rejecting request with non-doctor entity:',
          req.id,
          'entity type check failed'
        )
        return false
      }

      // Doctor MUST be linked to this clinic
      if (req.entity.clinic_id !== clinicId) {
        console.warn(
          '[getClinicRequests] ❌ Rejecting request where doctor.clinic_id mismatch:',
          req.id,
          'doctor.clinic_id:',
          req.entity.clinic_id,
          'expected:',
          clinicId
        )
        return false
      }

      console.log(
        '[getClinicRequests] ✅ Valid DOCTOR request:',
        req.id,
        'doctor_id:',
        req.entity.id
      )
      return true
    })

    console.log(
      '[getClinicRequests] Final filtered results:',
      filtered.length,
      'request_types:',
      filtered.map(f => f.request_type)
    )
    return filtered
  },

  // Get request by ID for clinic (with full doctor and user details)
  async getClinicRequestById(requestId: string, clinicId: string) {
    const req = await prisma.approvalRequest.findFirst({
      where: { id: requestId, clinic_id: clinicId, request_type: 'DOCTOR' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            onboarding_stage: true,
            image: true,
            phone_no: true,
            gender: true,
            dob: true,
            banned: true,
            banReason: true,
            banExpiresAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })
    return attachEntity(req)
  },

  // Approve a request by clinic
  async approveByClinic(requestId: string, clinicUserId: string, renewalDate?: Date) {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } })
    if (!request || !request.clinic_id) {
      return null
    }

    const updatedRequest = await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewed_by: clinicUserId,
        reviewed_at: new Date(),
        renewal_date: renewalDate || null,
      },
      include: { user: true },
    })
    await prisma.user.update({
      where: { id: request.user_id },
      data: { onboarding_stage: 'APPROVED_BY_CLINIC' },
    })
    return attachEntity(updatedRequest)
  },

  // Reject a request by clinic
  async rejectByClinic(requestId: string, clinicUserId: string, rejectionReason: string) {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } })
    if (!request || !request.clinic_id) {
      return null
    }

    const updatedRequest = await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejection_reason: rejectionReason,
        reviewed_by: clinicUserId,
        reviewed_at: new Date(),
      },
      include: { user: true },
    })
    await prisma.user.update({
      where: { id: request.user_id },
      data: { onboarding_stage: 'CLINIC_REJECT_DOCTOR' },
    })
    return attachEntity(updatedRequest)
  },
}
