import { EventEmitter } from 'node:events'

// Base data types for events
export type EmailTemplateData = Record<string, string | number | boolean | Date | null | undefined>
export type NotificationData = Record<string, string | number | boolean | Date | null | undefined>
export type AppointmentData = Record<string, string | number | boolean | Date | null | undefined>
export type PrescriptionData = Record<string, string | number | boolean | Date | null | undefined>
export type PaymentData = Record<string, string | number | boolean | Date | null | undefined>
export type DoctorData = Record<string, string | number | boolean | Date | null | undefined>
export type UserData = Record<string, string | number | boolean | Date | null | undefined>
export type ResetData = Record<string, string | number | boolean | Date | null | undefined>
export type ClinicData = Record<string, string | number | boolean | Date | null | undefined>

// Bulk import event data
export interface BulkDoctorImportEvent {
  importId: string
  csvContent: string
  adminId: string
  filename: string
}

// Event type definitions
export interface MailEvent {
  to: string | string[]
  subject: string
  template?: string
  html?: string
  text?: string
  data?: EmailTemplateData
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface NotificationEvent {
  userId: string
  type:
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_UPDATED'
    | 'APPOINTMENT_CANCELED'
    | 'PRESCRIPTION_CREATED'
    | 'PRESCRIPTION_UPDATED'
    | 'MESSAGE_RECEIVED'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'REVIEW_RECEIVED'
    | 'DOCTOR_APPROVED'
    | 'DOCTOR_REJECTED'
    | 'CLINIC_APPROVED'
    | 'CLINIC_REJECTED'
    | 'GENERAL'
  title: string
  message: string
  data?: NotificationData
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  channels?: Array<'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH'>
  scheduledFor?: Date
  expiresAt?: Date
}

// Event emitter class with typed events
class TypedEventEmitter extends EventEmitter {
  // Mail events
  emitSendMail(eventData: MailEvent): boolean {
    return this.emit('mail:send', eventData)
  }

  emitWelcomeMail(to: string, userData: UserData): boolean {
    return this.emit('mail:welcome', { to, userData })
  }

  emitPasswordResetMail(to: string, resetData: ResetData): boolean {
    return this.emit('mail:password-reset', { to, resetData })
  }

  emitAppointmentConfirmationMail(to: string, appointmentData: AppointmentData): boolean {
    return this.emit('mail:appointment-confirmation', { to, appointmentData })
  }

  emitAppointmentReminderMail(to: string, appointmentData: AppointmentData): boolean {
    return this.emit('mail:appointment-reminder', { to, appointmentData })
  }

  emitPrescriptionMail(to: string, prescriptionData: PrescriptionData): boolean {
    return this.emit('mail:prescription', { to, prescriptionData })
  }

  emitDoctorApprovalMail(to: string, doctorData: DoctorData): boolean {
    return this.emit('mail:doctor-approval', { to, doctorData })
  }

  emitDoctorRejectionMail(to: string, doctorData: DoctorData): boolean {
    return this.emit('mail:doctor-rejection', { to, doctorData })
  }

  emitClinicApprovalMail(to: string, clinicData: ClinicData): boolean {
    return this.emit('mail:clinic-approval', { to, clinicData })
  }

  emitClinicRejectionMail(to: string, clinicData: ClinicData): boolean {
    return this.emit('mail:clinic-rejection', { to, clinicData })
  }

  // Notification events
  emitCreateNotification(eventData: NotificationEvent): boolean {
    return this.emit('notification:create', eventData)
  }

  emitAppointmentNotification(
    userId: string,
    type: 'CREATED' | 'UPDATED' | 'CANCELED',
    appointmentData: AppointmentData
  ): boolean {
    const notificationData: NotificationEvent = {
      userId,
      type: `APPOINTMENT_${type}` as NotificationEvent['type'],
      title: `Appointment ${type.toLowerCase()}`,
      message: `Your appointment has been ${type.toLowerCase()}`,
      data: appointmentData,
      priority: type === 'CANCELED' ? 'HIGH' : 'MEDIUM',
      channels: ['IN_APP', 'EMAIL'],
    }
    return this.emit('notification:create', notificationData)
  }

  emitPrescriptionNotification(
    userId: string,
    type: 'CREATED' | 'UPDATED',
    prescriptionData: PrescriptionData
  ): boolean {
    const notificationData: NotificationEvent = {
      userId,
      type: `PRESCRIPTION_${type}` as NotificationEvent['type'],
      title: `Prescription ${type.toLowerCase()}`,
      message: `A prescription has been ${type.toLowerCase()} for you`,
      data: prescriptionData,
      priority: 'MEDIUM',
      channels: ['IN_APP', 'EMAIL'],
    }
    return this.emit('notification:create', notificationData)
  }

  emitPaymentNotification(
    userId: string,
    status: 'SUCCESS' | 'FAILED',
    paymentData: PaymentData
  ): boolean {
    const notificationData: NotificationEvent = {
      userId,
      type: `PAYMENT_${status}` as NotificationEvent['type'],
      title: `Payment ${status.toLowerCase()}`,
      message:
        status === 'SUCCESS'
          ? 'Your payment has been processed successfully'
          : 'Your payment has failed. Please try again.',
      data: paymentData,
      priority: status === 'FAILED' ? 'HIGH' : 'MEDIUM',
      channels: ['IN_APP', 'EMAIL'],
    }
    return this.emit('notification:create', notificationData)
  }

  emitMessageNotification(
    userId: string,
    messageData: {
      senderId: string
      senderName: string
      appointmentId: string
      content: string
    }
  ): boolean {
    const notificationData: NotificationEvent = {
      userId,
      type: 'MESSAGE_RECEIVED',
      title: 'New Message',
      message: `New message from ${messageData.senderName}`,
      data: messageData,
      priority: 'MEDIUM',
      channels: ['IN_APP', 'PUSH'],
    }
    return this.emit('notification:create', notificationData)
  }

  emitDoctorStatusNotification(
    userId: string,
    status: 'APPROVED' | 'REJECTED',
    doctorData: DoctorData
  ): boolean {
    const notificationData: NotificationEvent = {
      userId,
      type: `DOCTOR_${status}` as NotificationEvent['type'],
      title: `Doctor Application ${status}`,
      message:
        status === 'APPROVED'
          ? 'Congratulations! Your doctor application has been approved.'
          : 'Your doctor application has been rejected. Please contact support for more information.',
      data: doctorData,
      priority: 'HIGH',
      channels: ['IN_APP', 'EMAIL'],
    }
    return this.emit('notification:create', notificationData)
  }

  emitClinicStatusNotification(
    userId: string,
    status: 'APPROVED' | 'REJECTED',
    clinicData: ClinicData
  ): boolean {
    const notificationData: NotificationEvent = {
      userId,
      type: `CLINIC_${status}` as NotificationEvent['type'],
      title: `Clinic Application ${status}`,
      message:
        status === 'APPROVED'
          ? 'Congratulations! Your clinic application has been approved.'
          : 'Your clinic application has been rejected. Please contact support for more information.',
      data: clinicData,
      priority: 'HIGH',
      channels: ['IN_APP', 'EMAIL'],
    }
    return this.emit('notification:create', notificationData)
  }

  emitReviewNotification(
    userId: string,
    reviewData: {
      patientName: string
      rating: number
      comment?: string
      appointmentId: string
    }
  ): boolean {
    const notificationData: NotificationEvent = {
      userId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review',
      message: `${reviewData.patientName} left you a ${reviewData.rating}-star review`,
      data: reviewData,
      priority: 'LOW',
      channels: ['IN_APP'],
    }
    return this.emit('notification:create', notificationData)
  }

  // Bulk import events
  emitBulkDoctorImport(eventData: BulkDoctorImportEvent): boolean {
    return this.emit('bulk:doctor-import', eventData)
  }

  onBulkDoctorImport(listener: (eventData: BulkDoctorImportEvent) => void): this {
    return this.on('bulk:doctor-import', listener)
  }

  emitBulkImportError(error: Error, eventData: BulkDoctorImportEvent): boolean {
    return this.emit('bulk:error', { error, eventData })
  }

  onBulkImportError(
    listener: (data: { error: Error; eventData: BulkDoctorImportEvent }) => void
  ): this {
    return this.on('bulk:error', listener)
  }

  // Utility methods for event listener management
  onSendMail(listener: (eventData: MailEvent) => void): this {
    return this.on('mail:send', listener)
  }

  onWelcomeMail(listener: (data: { to: string; userData: UserData }) => void): this {
    return this.on('mail:welcome', listener)
  }

  onPasswordResetMail(listener: (data: { to: string; resetData: ResetData }) => void): this {
    return this.on('mail:password-reset', listener)
  }

  onAppointmentConfirmationMail(
    listener: (data: { to: string; appointmentData: AppointmentData }) => void
  ): this {
    return this.on('mail:appointment-confirmation', listener)
  }

  onAppointmentReminderMail(
    listener: (data: { to: string; appointmentData: AppointmentData }) => void
  ): this {
    return this.on('mail:appointment-reminder', listener)
  }

  onPrescriptionMail(
    listener: (data: { to: string; prescriptionData: PrescriptionData }) => void
  ): this {
    return this.on('mail:prescription', listener)
  }

  onDoctorApprovalMail(listener: (data: { to: string; doctorData: DoctorData }) => void): this {
    return this.on('mail:doctor-approval', listener)
  }

  onDoctorRejectionMail(listener: (data: { to: string; doctorData: DoctorData }) => void): this {
    return this.on('mail:doctor-rejection', listener)
  }

  onClinicApprovalMail(listener: (data: { to: string; clinicData: ClinicData }) => void): this {
    return this.on('mail:clinic-approval', listener)
  }

  onClinicRejectionMail(listener: (data: { to: string; clinicData: ClinicData }) => void): this {
    return this.on('mail:clinic-rejection', listener)
  }

  onCreateNotification(listener: (eventData: NotificationEvent) => void): this {
    return this.on('notification:create', listener)
  }

  // Error handling methods
  emitMailError(error: Error, eventData: MailEvent): boolean {
    return this.emit('mail:error', { error, eventData })
  }

  emitNotificationError(error: Error, eventData: NotificationEvent): boolean {
    return this.emit('notification:error', { error, eventData })
  }

  onMailError(listener: (data: { error: Error; eventData: MailEvent }) => void): this {
    return this.on('mail:error', listener)
  }

  onNotificationError(
    listener: (data: { error: Error; eventData: NotificationEvent }) => void
  ): this {
    return this.on('notification:error', listener)
  }
}

// Create and export a singleton instance
export const appEventEmitter = new TypedEventEmitter()

// Set max listeners to prevent memory leak warnings
appEventEmitter.setMaxListeners(50)

// Error handling for unhandled events
appEventEmitter.on('error', error => {
  console.error('Event emitter error:', error)
})

// Export types and event names for external usage
export const EVENT_NAMES = {
  MAIL: {
    SEND: 'mail:send',
    WELCOME: 'mail:welcome',
    PASSWORD_RESET: 'mail:password-reset',
    APPOINTMENT_CONFIRMATION: 'mail:appointment-confirmation',
    APPOINTMENT_REMINDER: 'mail:appointment-reminder',
    PRESCRIPTION: 'mail:prescription',
    DOCTOR_APPROVAL: 'mail:doctor-approval',
    DOCTOR_REJECTION: 'mail:doctor-rejection',
    CLINIC_APPROVAL: 'mail:clinic-approval',
    CLINIC_REJECTION: 'mail:clinic-rejection',
    ERROR: 'mail:error',
  },
  NOTIFICATION: {
    CREATE: 'notification:create',
    ERROR: 'notification:error',
  },
  BULK: {
    DOCTOR_IMPORT: 'bulk:doctor-import',
    ERROR: 'bulk:error',
  },
} as const

export type EventNames = typeof EVENT_NAMES

// Helper function to create batch operations
export const batchEmit = {
  sendMultipleMails: (mails: MailEvent[]): boolean[] => {
    return mails.map(mail => appEventEmitter.emitSendMail(mail))
  },

  createMultipleNotifications: (notifications: NotificationEvent[]): boolean[] => {
    return notifications.map(notification => appEventEmitter.emitCreateNotification(notification))
  },
}

export default appEventEmitter
