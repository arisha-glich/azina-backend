import { appEventEmitter } from '~/lib/event-emitter'
import {
  emailService as baseEmailService,
  registerEmailListeners as baseRegister,
} from '~/services/email.service'
import { type EmailTemplate, emailSubjects, renderEmailTemplate } from './render'

export function registerEmailListeners() {
  // We already register base listeners (nodemailer sender) elsewhere; calling it here ensures it's active
  baseRegister()

  // Bridge: when someone emits a template-based event, convert to generic mail:send
  appEventEmitter.on(
    'mail:send-template',
    async (data: {
      to: string | string[]
      template: EmailTemplate
      // biome-ignore lint/suspicious/noExplicitAny: Email template payload can have various shapes
      payload: Record<string, any>
    }) => {
      try {
        console.log(`📧 Rendering email template: ${data.template} for ${data.to}`)
        const html = await renderEmailTemplate(data.template, data.payload)
        const subject = emailSubjects[data.template]
        console.log(`📧 Emitting mail:send for ${data.to}`)
        appEventEmitter.emitSendMail({ to: data.to, subject, html })
      } catch (error) {
        console.error('❌ Error rendering email template:', error)
      }
    }
  )
}

// Convenient helpers
export const emailHelpers = {
  // Patient
  async sendWelcomeEmail(to: string, payload: { patientName: string; loginLink: string }) {
    appEventEmitter.emit('mail:send-template', { to, template: 'patient.welcome', payload })
  },
  // Generic (for CLINIC, DOCTOR, etc.)
  async sendGenericWelcomeEmail(
    to: string,
    payload: { name: string; role: string; loginLink: string }
  ) {
    appEventEmitter.emit('mail:send-template', { to, template: 'generic.welcome', payload })
  },
  async sendAppointmentBooked(
    to: string,
    payload: {
      patientName: string
      practitionerName: string
      appointmentDate: string
      appointmentTime: string
      appointmentLink: string
    }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'patient.appointmentBooked',
      payload,
    })
  },
  async sendAppointmentCancelled(
    to: string,
    payload: { patientName: string; practitionerName: string; appointmentDate: string }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'patient.appointmentCancelled',
      payload,
    })
  },
  async sendPrescriptionReady(
    to: string,
    payload: { patientName: string; prescriptionLink: string }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'patient.prescriptionReady',
      payload,
    })
  },

  // Practitioner
  async sendPractitionerApplicationReceived(to: string, payload: { practitionerName: string }) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'practitioner.applicationReceived',
      payload,
    })
  },
  async sendPractitionerAccountApproved(
    to: string,
    payload: { practitionerName: string; loginLink: string }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'practitioner.accountApproved',
      payload,
    })
  },
  async sendPractitionerProfileSetupInvitation(
    to: string,
    payload: {
      doctorName: string
      clinicName: string
      loginLink: string
      profileUpdateLink: string
    }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'practitioner.profileSetupInvitation',
      payload,
    })
  },
  async sendPractitionerReapprovalReminder(
    to: string,
    payload: { practitionerName: string; deadlineDate: string }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'practitioner.reapprovalReminder',
      payload,
    })
  },

  // Clinic
  async sendClinicApplicationReceived(to: string, payload: { clinicName: string }) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'clinic.applicationReceived',
      payload,
    })
  },
  async sendClinicAccountApproved(to: string, payload: { clinicName: string; loginLink: string }) {
    appEventEmitter.emit('mail:send-template', { to, template: 'clinic.accountApproved', payload })
  },
  async sendClinicDocumentRenewalReminder(
    to: string,
    payload: { clinicName: string; deadlineDate: string; uploadLink: string }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'clinic.documentRenewalReminder',
      payload,
    })
  },

  // Admin
  async sendAdminNewPractitioner(
    to: string,
    payload: { practitionerName: string; adminLink: string }
  ) {
    appEventEmitter.emit('mail:send-template', { to, template: 'admin.newPractitioner', payload })
  },
  async sendAdminNewClinic(to: string, payload: { clinicName: string; adminLink: string }) {
    appEventEmitter.emit('mail:send-template', { to, template: 'admin.newClinic', payload })
  },
  async sendAdminDocumentExpiryAlert(
    to: string,
    payload: { entityName: string; documentType: string; expiryDate: string }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'admin.documentExpiryAlert',
      payload,
    })
  },
  async sendAdminTeamMemberCredentials(
    to: string,
    payload: { name: string; email: string; password: string; roleName: string; loginLink: string }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'admin.teamMemberCredentials',
      payload,
    })
  },
}

// For direct access if needed
export const emailService = baseEmailService
