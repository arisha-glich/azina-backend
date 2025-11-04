/**
 * Email Event Emitter Usage Examples
 *
 * This file shows examples of how to use the event emitter to send emails
 * in your services and handlers.
 */

import { appEventEmitter } from './event-emitter'

// Example 1: Send welcome email when user registers
export async function sendWelcomeEmailExample(userEmail: string, userName: string) {
  appEventEmitter.emitWelcomeMail(userEmail, {
    name: userName,
    email: userEmail,
  })
}

// Example 2: Send doctor approval email when doctor is approved
export async function sendDoctorApprovalEmailExample(
  doctorEmail: string,
  doctorName: string,
  specialization: string
) {
  appEventEmitter.emitDoctorApprovalMail(doctorEmail, {
    doctorName,
    specialization,
    approvalDate: new Date(),
  })

  // Also create a notification
  appEventEmitter.emitDoctorStatusNotification(doctorEmail, 'APPROVED', {
    doctorName,
    specialization,
  })
}

// Example 3: Send clinic approval email when clinic is approved
export async function sendClinicApprovalEmailExample(clinicEmail: string, clinicName: string) {
  appEventEmitter.emitClinicApprovalMail(clinicEmail, {
    clinicName,
    approvalDate: new Date(),
  })

  // Also create a notification
  appEventEmitter.emitClinicStatusNotification(clinicEmail, 'APPROVED', {
    clinicName,
  })
}

// Example 4: Send custom email using generic mail event
export async function sendCustomEmailExample(email: string, subject: string, html: string) {
  appEventEmitter.emitSendMail({
    to: email,
    subject,
    html,
  })
}

// Example 5: Send password reset email
export async function sendPasswordResetEmailExample(email: string, resetLink: string) {
  appEventEmitter.emitPasswordResetMail(email, {
    resetLink,
    expiresIn: '1 hour',
  })
}

/**
 * Usage in Services:
 *
 * import { appEventEmitter } from '~/lib/event-emitter'
 *
 * // In your service function
 * async function approveDoctor(doctorId: string) {
 *   // ... update doctor status in database
 *
 *   // Send approval email via event emitter
 *   appEventEmitter.emitDoctorApprovalMail(doctor.email, {
 *     doctorName: doctor.name,
 *     specialization: doctor.specialization,
 *   })
 * }
 */
