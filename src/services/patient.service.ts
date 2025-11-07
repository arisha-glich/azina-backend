import prisma from '~/lib/prisma'

type PatientProfilePayload = {
  dateOfBirth?: string | null
  gender?: string | null
  phoneCode?: string | null
  phoneNumber?: string | null
  streetAddress?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
}

function normalisePhone(phoneCode?: string | null, phoneNumber?: string | null) {
  if (!phoneCode && !phoneNumber) {
    return null
  }
  const code = phoneCode?.trim() ?? ''
  const number = phoneNumber?.trim() ?? ''
  return [code, number].filter(Boolean).join(' ')
}

function splitPhone(phone?: string | null) {
  if (!phone) {
    return { phoneCode: null, phoneNumber: null }
  }
  const [code, ...rest] = phone.split(' ')
  return {
    phoneCode: code ?? null,
    phoneNumber: rest.join(' ') || null,
  }
}

export const patientService = {
  async getPatientProfile(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
    })

    if (!patient) {
      return null
    }

    const address = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const { phoneCode, phoneNumber } = splitPhone(patient.phone_number)

    return {
      patient,
      address,
      phoneCode,
      phoneNumber,
    }
  },

  async updatePatientProfile(userId: string, payload: PatientProfilePayload) {
    const {
      dateOfBirth,
      gender,
      phoneCode,
      phoneNumber,
      streetAddress,
      city,
      state,
      postalCode,
      country,
    } = payload

    const parsedDob = dateOfBirth
      ? (() => {
          const parsed = new Date(dateOfBirth)
          return Number.isNaN(parsed.getTime()) ? null : parsed
        })()
      : null

    const phone = normalisePhone(phoneCode, phoneNumber)

    const patient = await prisma.patient.upsert({
      where: { user_id: userId },
      update: {
        date_of_birth: parsedDob,
        gender: gender ?? null,
        phone_number: phone,
      },
      create: {
        user: {
          connect: { id: userId },
        },
        date_of_birth: parsedDob,
        gender: gender ?? null,
        phone_number: phone,
      },
    })

    const existingAddress = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const address = existingAddress
      ? await prisma.address.update({
          where: { id: existingAddress.id },
          data: {
            street_address: streetAddress ?? existingAddress.street_address,
            city: city ?? existingAddress.city,
            state: state ?? existingAddress.state,
            postal_code: postalCode ?? existingAddress.postal_code,
            country: country ?? existingAddress.country,
          },
        })
      : await prisma.address.create({
          data: {
            street_address: streetAddress ?? '',
            city: city ?? '',
            state: state ?? '',
            postal_code: postalCode ?? '',
            country: country ?? '',
            user: {
              connect: { id: userId },
            },
            patients: {
              connect: { id: patient.id },
            },
          },
        })

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_stage: 'PATIENT_PROFILE_COMPLETED',
      },
      select: {
        onboarding_stage: true,
      },
    })

    const { phoneCode: updatedPhoneCode, phoneNumber: updatedPhoneNumber } = splitPhone(
      phone ?? patient.phone_number
    )

    return {
      patient: {
        ...patient,
        date_of_birth: parsedDob ?? patient.date_of_birth,
        gender: gender ?? patient.gender,
        phone_number: phone ?? patient.phone_number,
      },
      address,
      phoneCode: updatedPhoneCode,
      phoneNumber: updatedPhoneNumber,
      onboarding_stage: updatedUser.onboarding_stage,
    }
  },
}

