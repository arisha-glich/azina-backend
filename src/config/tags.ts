/**
 * API Tags Configuration
 * These tags are used in OpenAPI documentation to group endpoints
 */

export const API_TAGS = {
  TEST: 'Test',
  USER: 'User',
  DOCTOR: 'Doctor',
  CLINIC: 'Clinic',
  PATIENT: 'Patient',
  APPOINTMENT: 'Appointment',
  SERVICE: 'Service',
  ADMIN: 'Admin',
  STORAGE: 'Storage',
} as const

export type ApiTag = (typeof API_TAGS)[keyof typeof API_TAGS]
