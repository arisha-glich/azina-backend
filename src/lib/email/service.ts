import { appEventEmitter } from '~/lib/event-emitter'
import {
  emailService as baseEmailService,
  registerEmailListeners as baseRegister,
} from '~/services/email.service'
import { type EmailTemplate, emailSubjects, renderEmailTemplate } from './render'

export function registerEmailListeners() {
  baseRegister()

  appEventEmitter.on(
    'mail:send-template',
    async (data: {
      to: string | string[]
      template: EmailTemplate
      // biome-ignore lint/suspicious/noExplicitAny: Email template payload can have various shapes
      payload: Record<string, any>
    }) => {
      try {
      const html = await renderEmailTemplate(data.template, data.payload)
      const subject = emailSubjects[data.template]
      appEventEmitter.emitSendMail({ to: data.to, subject, html })
    } catch (error) {
      console.error('❌ Error rendering email template:', error)
    }
    }
  )
}

export const emailHelpers = {
  async sendWelcomeEmail(to: string, payload: { patientName: string; loginLink: string }) {
    appEventEmitter.emit('mail:send-template', { to, template: 'patient.welcome', payload })
  },
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
  async notifyAdminsDoctorDocumentsUpdated(
    recipients: string[],
    payload: { doctorName: string; doctorEmail: string; updatedAt: string }
  ) {
    if (!recipients.length) return
    const html = `
      <html>
        <body>
          <p>Hi Admin,</p>
          <p>Doctor <strong>${payload.doctorName}</strong> (${payload.doctorEmail}) has updated their compliance documents.</p>
          <p>Updated at: ${payload.updatedAt}</p>
          <p>Please review the submission in the admin dashboard.</p>
        </body>
      </html>
    `
    await baseEmailService.send({
      to: recipients,
      subject: `Doctor ${payload.doctorName} updated documents`,
      html,
    })
  },
  async notifyClinicDoctorDocumentsUpdated(
    recipients: string | string[],
    payload: { doctorName: string; doctorEmail: string; clinicName?: string; updatedAt: string }
  ) {
    const html = `
      <html>
        <body>
          <p>Hello${payload.clinicName ? ` ${payload.clinicName}` : ''},</p>
          <p>Doctor <strong>${payload.doctorName}</strong> (${payload.doctorEmail}) linked to your clinic has updated their compliance documents.</p>
          <p>Updated at: ${payload.updatedAt}</p>
          <p>Please log in to review and approve the changes.</p>
        </body>
      </html>
    `
    await baseEmailService.send({
      to: recipients,
      subject: `Doctor ${payload.doctorName} updated documents`,
      html,
    })
  },
  async notifyAdminsClinicDocumentsUpdated(
    recipients: string[],
    payload: { clinicName: string; clinicEmail: string; updatedAt: string }
  ) {
    if (!recipients.length) return
    const html = `
      <html>
        <body>
          <p>Hi Admin,</p>
          <p>Clinic <strong>${payload.clinicName}</strong> (${payload.clinicEmail}) has updated its compliance documents.</p>
          <p>Updated at: ${payload.updatedAt}</p>
          <p>Please review the submission in the admin dashboard.</p>
        </body>
      </html>
    `
    await baseEmailService.send({
      to: recipients,
      subject: `Clinic ${payload.clinicName} updated documents`,
      html,
    })
  },
  async sendDoctorCredentialsEmail(
    to: string,
    payload: {
      doctorName: string
      clinicName: string
      email: string
      password: string
      loginLink: string
    }
  ) {
    const html = `
      <html>
        <body>
          <p>Hi ${payload.doctorName},</p>
          <p>You have been added as a doctor by <strong>${payload.clinicName}</strong>.</p>
          <p>Your login details are:</p>
          <ul>
            <li>Email: <strong>${payload.email}</strong></li>
            <li>Password: <strong>${payload.password}</strong></li>
          </ul>
          <p>You can sign in here: <a href="${payload.loginLink}">${payload.loginLink}</a></p>
          <p>Please keep these credentials secure and update your password after logging in.</p>
        </body>
      </html>
    `

    await baseEmailService.send({
      to,
      subject: `You're now part of ${payload.clinicName}`,
      html,
    })
  },
  async notifyDoctorDocumentsUpdatedSelf(
    to: string,
    payload: { doctorName: string; updatedAt: string }
  ) {
    const html = `
      <html>
        <body>
          <p>Hi ${payload.doctorName},</p>
          <p>Your documents were successfully updated.</p>
          <p>Updated at: ${payload.updatedAt}</p>
        </body>
      </html>
    `

    await baseEmailService.send({
      to,
      subject: 'Your documents were updated',
      html,
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

export const emailService = baseEmailService
