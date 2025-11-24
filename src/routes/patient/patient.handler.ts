import * as HttpStatusCodes from 'stoker/http-status-codes'
import { patientService } from '~/services/patient.service'
import type { PATIENT_ROUTES } from '~/routes/patient/patient.routes'
import type { HandlerMapFromRoutes } from '~/types'

export const PATIENT_ROUTE_HANDLER: HandlerMapFromRoutes<typeof PATIENT_ROUTES> = {
  get_my_patient_profile: async c => {
    try {
      const userId = c.get('user')?.id

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const result = await patientService.getPatientProfile(userId)

      if (!result) {
        return c.json(
          { message: 'Patient profile not found', success: false },
          HttpStatusCodes.NOT_FOUND
        )
      }

      const { patient, address, phoneCode, phoneNumber } = result

      const dateOfBirth = patient.date_of_birth
        ? patient.date_of_birth.toISOString().split('T')[0]
        : null

      return c.json(
        {
          message: 'Patient profile retrieved successfully',
          success: true,
          data: {
            dateOfBirth,
            gender: patient.gender,
            phoneCode,
            phoneNumber,
            streetAddress: address?.street_address ?? null,
            city: address?.city ?? null,
            state: address?.state ?? null,
            postalCode: address?.postal_code ?? null,
            country: address?.country ?? null,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error retrieving patient profile:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  update_my_patient_profile: async c => {
    try {
      const userId = c.get('user')?.id
      const payload = c.req.valid('json')

      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const result = await patientService.updatePatientProfile(userId, payload)

      const dateOfBirth = result.patient.date_of_birth
        ? result.patient.date_of_birth.toISOString().split('T')[0]
        : null

      return c.json(
        {
          message: 'Patient profile updated successfully',
          success: true,
          data: {
            dateOfBirth,
            gender: result.patient.gender,
            phoneCode: result.phoneCode,
            phoneNumber: result.phoneNumber,
            streetAddress: result.address?.street_address ?? null,
            city: result.address?.city ?? null,
            state: result.address?.state ?? null,
            postalCode: result.address?.postal_code ?? null,
            country: result.address?.country ?? null,
            onboardingStage: result.onboarding_stage,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error updating patient profile:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}

