import { hashPassword } from 'better-auth/crypto'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { isClinicRole } from '~/lib/auth-permissions'
import { emailHelpers } from '~/lib/email/service'
import { convertImagesToSignedUrls } from '~/lib/image-url-converter'
import prisma from '~/lib/prisma'
import type { CLINIC_ROUTES } from '~/routes/clinic/clinic.routes'
import { approvalService } from '~/services/approval.service'
import { clinicService } from '~/services/clinic.service'
import type { HandlerMapFromRoutes } from '~/types'

export const CLINIC_ROUTE_HANDLER: HandlerMapFromRoutes<typeof CLINIC_ROUTES> = {
  get_my_clinic: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const clinic = await clinicService.getClinicByUserId(userId)

      if (!clinic) {
        return c.json(
          {
            message: 'Clinic not found. Please ensure your user role is set to CLINIC.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      // Convert image URLs to signed URLs
      const processedClinic = await convertImagesToSignedUrls(clinic)

      return c.json(
        {
          message: 'Clinic retrieved successfully',
          success: true,
          data: processedClinic,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving clinic:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_my_clinic: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const result = await clinicService.updateClinicByUserId(userId, updateData)

      if (!result) {
        return c.json(
          {
            message: 'Clinic not found. Please ensure your user role is set to CLINIC.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Clinic updated successfully',
          success: true,
          data: result.clinic,
          onboarding_stage: result.onboarding_stage,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating clinic:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_my_clinic_documents: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const result = await clinicService.notifyClinicDocumentsUpdate(userId, updateData)
      if (!result) {
        return c.json(
          { message: 'Clinic not found. Please ensure your user role is set to CLINIC.', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const processedClinic = await convertImagesToSignedUrls(result.clinic)

      return c.json(
        {
          message: 'Clinic documents updated and admin notified',
          success: true,
          data: {
            clinic: processedClinic,
            notificationTarget: result.notificationTarget,
            notifiedAt: result.updatedAt,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating clinic documents:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_my_clinic_documents: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const clinic = await clinicService.getClinicByUserId(userId)

      if (!clinic) {
        return c.json(
          { message: 'Clinic not found. Please ensure your user role is set to CLINIC.', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const documents = {
        clinicLogo: clinic.clinicLogo,
        companyRegistrationCertificate: clinic.companyRegistrationCertificate,
        proofOfBusinessAddress: clinic.proofOfBusinessAddress,
        registrationCertificate: clinic.registrationCertificate,
        otherDocuments: clinic.otherDocuments,
        signature: clinic.signature,
        Logo: clinic.Logo,
      }

      const processedDocuments = await convertImagesToSignedUrls(documents)

      return c.json(
        {
          message: 'Clinic documents retrieved successfully',
          success: true,
          data: processedDocuments,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving clinic documents:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  create_my_clinic: async c => {
    try {
      const userId = c.get('user')?.id
      const updateData = c.req.valid('json')

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const clinic = await clinicService.updateClinicByUserIdSimple(userId, updateData)

      if (!clinic) {
        return c.json(
          {
            message: 'Clinic not found. Please ensure your user role is set to CLINIC.',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Clinic updated successfully',
          success: true,
          data: clinic,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating clinic:', error)
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

      const clinic = await clinicService.getClinicByUserId(userId)
      if (!clinic) {
        return c.json({ message: 'Clinic not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      const requests = await approvalService.getClinicRequests(clinic.id, status)

      const processedItems = await convertImagesToSignedUrls(requests)

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

      const clinic = await clinicService.getClinicByUserId(userId)
      if (!clinic) {
        return c.json({ message: 'Clinic not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      const requests = await approvalService.getClinicRequests(clinic.id, status)
      const latest = requests[0] ?? null

      const processedItem = latest ? await convertImagesToSignedUrls(latest) : null

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

      const clinic = await clinicService.getClinicByUserId(userId)
      if (!clinic) {
        return c.json({ message: 'Clinic not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      const requests = await approvalService.getClinicRequests(clinic.id)
      const latest = requests[0] ?? null

      return c.json(
        {
          message: 'Request status retrieved successfully',
          success: true,
          data: latest
            ? {
                id: latest.id,
                request_type: latest.request_type,
                status: latest.status,
                rejection_reason: latest.rejection_reason,
                reviewed_at: latest.reviewed_at,
                createdAt: latest.createdAt,
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

  get_clinic_doctors: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const clinic = await clinicService.getClinicByUserId(userId)

      if (!clinic) {
        return c.json({ message: 'Clinic not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      const doctors = await clinicService.getApprovedClinicDoctors(clinic.id)

      const processedDoctors = await convertImagesToSignedUrls(doctors)

      return c.json(
        {
          message: 'Clinic doctors retrieved successfully',
          success: true,
          data: processedDoctors,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving clinic doctors:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_clinic_doctor_by_id: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Verify user is a clinic user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!isClinicRole(user?.role)) {
        return c.json(
          {
            message: 'Only clinic users can access this endpoint',
            success: false,
          },
          HttpStatusCodes.FORBIDDEN
        )
      }

      // Get the clinic for this user
      let clinic = await clinicService.getClinicByUserId(userId)

      if (!clinic) {
        // Try to auto-create clinic if user is CLINIC role
        const userData = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, role: true },
        })

        if (userData && isClinicRole(userData.role)) {
          // Auto-create clinic if user is CLINIC role
          clinic = await prisma.clinic.create({
            data: {
              clinic_name: userData.name || userData.email || `Clinic-${userId.slice(0, 8)}`,
              user_id: userId,
              is_active: true,
            },
            include: { user: true, address: true },
          })
        } else {
          return c.json(
            {
              message:
                'Clinic not found. Please ensure your user role is set to CLINIC and clinic profile is created.',
              success: false,
            },
            HttpStatusCodes.NOT_FOUND
          )
        }
      }

      // Get doctor ID from params
      const { id: doctorId } = c.req.valid('param')

      // Get the specific doctor for this clinic
      const doctor = await clinicService.getClinicDoctorById(clinic.id, doctorId)

      if (!doctor) {
        return c.json(
          {
            message: 'Doctor not found or does not belong to this clinic',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      // Convert image URLs to signed URLs
      const processedDoctor = await convertImagesToSignedUrls(doctor)

      return c.json(
        {
          message: 'Clinic doctor retrieved successfully',
          success: true,
          data: processedDoctor,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving clinic doctor:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_approved_clinics: async c => {
    try {
      const clinics = await clinicService.getApprovedClinics()

      // Convert image URLs to signed URLs
      const processedClinics = await convertImagesToSignedUrls(clinics)

      return c.json(
        {
          message: 'Approved clinics retrieved successfully',
          success: true,
          data: processedClinics,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving approved clinics:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_clinic_by_id: async c => {
    try {
      const { id } = c.req.valid('param')
      const clinic = await clinicService.getClinicById(id)

      if (!clinic) {
        return c.json({ message: 'Clinic not found', success: false }, HttpStatusCodes.NOT_FOUND)
      }

      // Convert image URLs to signed URLs
      const processedClinic = await convertImagesToSignedUrls(clinic)

      return c.json(
        {
          message: 'Clinic retrieved successfully',
          success: true,
          data: processedClinic,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving clinic:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  create_doctor: async c => {
    try {
      // Get logged-in user from session
      const session = c.get('user')
      if (!session?.id) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Check if logged-in user is a CLINIC
      const loggedInUser = await prisma.user.findUnique({
        where: { id: session.id },
      })

      if (!loggedInUser || !isClinicRole(loggedInUser.role)) {
        return c.json(
          { message: 'Only clinic users can create doctors', success: false },
          HttpStatusCodes.FORBIDDEN
        )
      }

      // Get the clinic associated with this user (with auto-creation if needed)
      let clinic = await clinicService.getClinicByUserId(session.id)

      // If clinic doesn't exist, create a basic one (similar to get_clinic_doctors handler)
      if (!clinic) {
        const user = await prisma.user.findUnique({
          where: { id: session.id },
          select: { name: true, email: true },
        })

        const clinicName = user?.name || user?.email || `Clinic-${session.id.slice(0, 8)}`

        clinic = await prisma.clinic.create({
          data: {
            clinic_name: clinicName,
            user_id: session.id,
            is_active: true,
          },
          include: {
            user: true,
            address: true,
          },
        })

      }

      // Get request data
      const data = c.req.valid('json')
      const fullName = `${data.firstName} ${data.lastName}`

      // Step 1: Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser) {
        return c.json({ message: 'Email already exists', success: false }, HttpStatusCodes.CONFLICT)
      }

      // Step 2: Hash password using better-auth's crypto hash function
      const hashedPassword = await hashPassword(data.password)

      // Step 3: Create User with DOCTOR role directly via Prisma
      let newUser: Awaited<ReturnType<typeof prisma.user.create>> | null = null
      try {
        newUser = await prisma.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            name: fullName,
            role: 'DOCTOR',
            phone_no: data.phone_no || null,
            onboarding_stage: 'doctor-clinic-detail',
            emailVerified: false,
          },
        })
        // biome-ignore lint/suspicious/noExplicitAny: Prisma error types are dynamic
      } catch (error: any) {
        // Handle unique constraint errors
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
          return c.json(
            { message: 'Email already exists', success: false },
            HttpStatusCodes.CONFLICT
          )
        }
        console.error('Error creating user:', error)
        return c.json(
          { message: 'Failed to create user', success: false },
          HttpStatusCodes.INTERNAL_SERVER_ERROR
        )
      }

      const newUserId = newUser.id

      // Step 4: Create Account record for email/password authentication
      // better-auth uses Account model to link authentication providers to users
      try {
        await prisma.account.create({
          data: {
            id: `acc_${newUserId}_${Date.now()}`,
            accountId: data.email,
            providerId: 'credential', // better-auth uses 'credential' for email/password
            userId: newUserId,
            password: hashedPassword, // Store password hash in account table for better-auth compatibility
          },
        })
        // biome-ignore lint/suspicious/noExplicitAny: Prisma error types are dynamic
      } catch (error: any) {
        // If account creation fails, clean up the user
        try {
          await prisma.user.delete({ where: { id: newUserId } })
        } catch (deleteError) {
          console.error('Error cleaning up user after account creation failure:', deleteError)
        }
        console.error('Error creating account:', error)
        return c.json(
          { message: 'Failed to create account', success: false },
          HttpStatusCodes.INTERNAL_SERVER_ERROR
        )
      }

      // Step 5: Create Doctor profile linked to the clinic
      let newDoctor = null
      try {
        newDoctor = await prisma.doctor.create({
          data: {
            user_id: newUserId,
            specialization: data.specialization,
            license_number: data.license_number,
            availability_status: 'AVAILABLE',
            clinic_id: clinic.id,
            phone_no: data.phone_no || null,
          },
          include: {
            user: true,
            clinic: true,
          },
        })
        // biome-ignore lint/suspicious/noExplicitAny: Prisma error types are dynamic
      } catch (error: any) {
        // If doctor creation fails, clean up both user and account
        try {
          await prisma.account.deleteMany({ where: { userId: newUserId } })
          await prisma.user.delete({ where: { id: newUserId } })
        } catch (deleteError) {
          console.error(
            'Error cleaning up user and account after doctor creation failure:',
            deleteError
          )
        }

        // Handle unique constraint errors (license number already exists)
        if (error.code === 'P2002') {
          return c.json(
            { message: 'License number already exists', success: false },
            HttpStatusCodes.CONFLICT
          )
        }

        throw error
      }

      // Step 6: Send email to doctor with profile setup instructions
      try {
        const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
        const profileUpdateLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/doctor/profile`

        await emailHelpers.sendPractitionerProfileSetupInvitation(newUser.email, {
          doctorName: fullName,
          clinicName: clinic.clinic_name,
          loginLink,
          profileUpdateLink,
        })

        await emailHelpers.sendDoctorCredentialsEmail(newUser.email, {
          doctorName: fullName,
          clinicName: clinic.clinic_name,
          email: newUser.email,
          password: data.password,
          loginLink,
        })
      } catch (emailError) {
        // Log error but don't fail the request
        console.error('❌ Error sending profile setup invitation email:', emailError)
      }

      return c.json(
        {
          message: 'Doctor created and linked to clinic successfully',
          success: true,
          data: {
            user: newDoctor?.user,
            doctor: newDoctor,
          },
        },
        HttpStatusCodes.CREATED
      )
      // biome-ignore lint/suspicious/noExplicitAny: Prisma error types are dynamic
    } catch (error: any) {
      console.error('Error creating doctor:', error)

      // Handle unique constraint errors
      if (error.code === 'P2002') {
        return c.json(
          { message: 'Email or license number already exists', success: false },
          HttpStatusCodes.CONFLICT
        )
      }

      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_clinic_requests: async c => {
    try {
      const userId = c.get('user')?.id

      // Get raw query params and clean up malformed status values
      const rawStatus = c.req.query('status')
      let status: 'PENDING' | 'APPROVED' | 'REJECTED' | undefined

      if (rawStatus) {
        // Clean up malformed query params (handle cases like "PENDING?status=PENDING")
        const cleaned = rawStatus.split('?')[0].split('&')[0].trim()
        if (['PENDING', 'APPROVED', 'REJECTED'].includes(cleaned)) {
          status = cleaned as 'PENDING' | 'APPROVED' | 'REJECTED'
        }
      }

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Verify user is a clinic user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!isClinicRole(user?.role)) {
        return c.json(
          {
            message: `Only clinic users can access this endpoint. Your role is: ${user?.role || 'not set'}. Expected role: CLINIC`,
            success: false,
          },
          HttpStatusCodes.FORBIDDEN
        )
      }

      // Get clinic for this user
      const clinic = await clinicService.getClinicByUserId(userId)

      if (!clinic) {
        // Try to auto-create clinic if user is CLINIC role
        const userData = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, role: true },
        })

        if (userData && isClinicRole(userData.role)) {
          try {
            await prisma.clinic.create({
              data: {
                clinic_name: userData.name || userData.email || `Clinic-${userId.slice(0, 8)}`,
                user_id: userId,
                is_active: true,
              },
            })
            // Retry getting clinic
            const newClinic = await clinicService.getClinicByUserId(userId)
            if (!newClinic) {
              return c.json(
                {
                  message: 'Clinic not found',
                  success: false,
                },
                HttpStatusCodes.NOT_FOUND
              )
            }

            const requests = await approvalService.getClinicRequests(newClinic.id, status)

            return c.json(
              {
                message: 'Requests retrieved successfully',
                success: true,
                data: requests,
              },
              HttpStatusCodes.OK
            )
            // biome-ignore lint/suspicious/noExplicitAny: Prisma error types are dynamic
          } catch (createError: any) {
            console.error('❌ Error auto-creating clinic:', createError)
            return c.json(
              {
                message: `Failed to create clinic profile: ${createError.message || 'Unknown error'}`,
                success: false,
              },
              HttpStatusCodes.INTERNAL_SERVER_ERROR
            )
          }
        } else {
          return c.json(
            {
              message: 'Clinic not found',
              success: false,
            },
            HttpStatusCodes.NOT_FOUND
          )
        }
      }

      const requests = await approvalService.getClinicRequests(clinic.id, status)

      // Convert image URLs to signed URLs
      const processedRequests = await convertImagesToSignedUrls(requests)

      return c.json(
        {
          message: 'Requests retrieved successfully',
          success: true,
          data: processedRequests,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving clinic requests:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  get_clinic_request_by_id: async c => {
    try {
      const userId = c.get('user')?.id
      const params = c.req.valid('param')
      const requestId = params.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Verify user is a clinic user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!isClinicRole(user?.role)) {
        return c.json(
          {
            message: `Only clinic users can access this endpoint. Your role is: ${user?.role || 'not set'}. Expected role: CLINIC`,
            success: false,
          },
          HttpStatusCodes.FORBIDDEN
        )
      }

      // Get clinic for this user
      const clinic = await clinicService.getClinicByUserId(userId)

      if (!clinic) {
        return c.json(
          {
            message: 'Clinic not found',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const request = await approvalService.getClinicRequestById(requestId, clinic.id)

      if (!request) {
        return c.json(
          {
            message: 'Request not found',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      // Convert image URLs to signed URLs
      const processedRequest = await convertImagesToSignedUrls(request)

      return c.json(
        {
          message: 'Request details retrieved successfully',
          success: true,
          data: processedRequest,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving request details:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  approve_clinic_request: async c => {
    try {
      const userId = c.get('user')?.id
      const params = c.req.valid('param')
      const body = c.req.valid('json')
      const requestId = params.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      // Verify user is a clinic user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!isClinicRole(user?.role)) {
        return c.json(
          {
            message: 'Only clinic users can approve requests',
            success: false,
          },
          HttpStatusCodes.FORBIDDEN
        )
      }

      // Get clinic for this user
      const clinic = await clinicService.getClinicByUserId(userId)

      if (!clinic) {
        return c.json(
          {
            message: 'Clinic not found',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      // Parse renewal_date if provided
      const renewalDate = body.renewal_date ? new Date(body.renewal_date) : undefined

      const approvedRequest = await approvalService.approveByClinic(requestId, userId, renewalDate)

      if (!approvedRequest) {
        return c.json(
          {
            message: 'Request not found or does not belong to this clinic',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Request approved successfully',
          success: true,
          data: approvedRequest,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error approving request:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  reject_clinic_request: async c => {
    try {
      const userId = c.get('user')?.id
      const params = c.req.valid('param')
      const body = c.req.valid('json')
      const requestId = params.id
      const rejectionReason = body.rejection_reason

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      if (!rejectionReason || rejectionReason.trim() === '') {
        return c.json(
          {
            message: 'Rejection reason is required',
            success: false,
          },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      // Verify user is a clinic user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!isClinicRole(user?.role)) {
        return c.json(
          {
            message: 'Only clinic users can reject requests',
            success: false,
          },
          HttpStatusCodes.FORBIDDEN
        )
      }

      // Get clinic for this user
      const clinic = await clinicService.getClinicByUserId(userId)

      if (!clinic) {
        return c.json(
          {
            message: 'Clinic not found',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const rejectedRequest = await approvalService.rejectByClinic(
        requestId,
        userId,
        rejectionReason
      )

      if (!rejectedRequest) {
        return c.json(
          {
            message: 'Request not found or does not belong to this clinic',
            success: false,
          },
          HttpStatusCodes.NOT_FOUND
        )
      }

      return c.json(
        {
          message: 'Request rejected successfully',
          success: true,
          data: rejectedRequest,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error rejecting request:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
} as HandlerMapFromRoutes<typeof CLINIC_ROUTES>
