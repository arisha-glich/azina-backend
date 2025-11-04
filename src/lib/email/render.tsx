/** @jsxImportSource react */
import { render } from '@react-email/components'
import type * as React from 'react'
import {
  AdminDocumentExpiryAlertEmail,
  AdminNewClinicEmail,
  AdminNewPractitionerEmail,
  AdminTeamMemberCredentialsEmail,
  AppointmentBookedEmail,
  AppointmentCancelledEmail,
  ClinicAccountApprovedEmail,
  ClinicApplicationReceivedEmail,
  ClinicDocumentRenewalReminderEmail,
  GenericWelcomeEmail,
  PractitionerAccountApprovedEmail,
  PractitionerApplicationReceivedEmail,
  PractitionerProfileSetupInvitationEmail,
  PractitionerReapprovalReminderEmail,
  PrescriptionReadyEmail,
  WelcomeEmail,
} from '../../../emails'

export type EmailTemplate =
  | 'patient.welcome'
  | 'generic.welcome'
  | 'patient.appointmentBooked'
  | 'patient.appointmentCancelled'
  | 'patient.prescriptionReady'
  | 'practitioner.applicationReceived'
  | 'practitioner.accountApproved'
  | 'practitioner.profileSetupInvitation'
  | 'practitioner.reapprovalReminder'
  | 'clinic.applicationReceived'
  | 'clinic.accountApproved'
  | 'clinic.documentRenewalReminder'
  | 'admin.newPractitioner'
  | 'admin.newClinic'
  | 'admin.documentExpiryAlert'
  | 'admin.teamMemberCredentials'

export const emailSubjects: Record<EmailTemplate, string> = {
  'patient.welcome': 'Welcome to Azina Health — Your Digital Health Partner',
  'generic.welcome': 'Welcome to Azina Health — Your Digital Health Partner',
  'patient.appointmentBooked': 'Your Appointment Has Been Successfully Booked',
  'patient.appointmentCancelled': 'Your Appointment Has Been Cancelled',
  'patient.prescriptionReady': 'Your Prescription is Ready for Collection or Delivery',
  'practitioner.applicationReceived': "We've Received Your Practitioner Application",
  'practitioner.accountApproved': 'Your Azina Health Practitioner Account Has Been Approved',
  'practitioner.profileSetupInvitation': 'Welcome to Azina Health — Complete Your Doctor Profile',
  'practitioner.reapprovalReminder': 'Reminder: Submit Updated Regulatory Documents for Reapproval',
  'clinic.applicationReceived': "We've Received Your Clinic Registration",
  'clinic.accountApproved': 'Your Clinic Account Has Been Approved',
  'clinic.documentRenewalReminder': "Action Required: Update Your Clinic's Regulatory Documents",
  'admin.newPractitioner': 'New Practitioner Application Submitted',
  'admin.newClinic': 'New Clinic Application Pending Approval',
  'admin.documentExpiryAlert': 'Upcoming Expiry: Practitioner or Clinic Regulatory Document',
  'admin.teamMemberCredentials': 'Welcome to Azina Health — Your Team Account Credentials',
}

export async function renderEmailTemplate(
  template: EmailTemplate,
  // biome-ignore lint/suspicious/noExplicitAny: Email template data can have various shapes
  data: Record<string, any>
): Promise<string> {
  let component: React.ReactElement

  switch (template) {
    case 'patient.welcome':
      component = <WelcomeEmail patientName={data.patientName} loginLink={data.loginLink} />
      break
    case 'generic.welcome':
      component = (
        <GenericWelcomeEmail name={data.name} role={data.role} loginLink={data.loginLink} />
      )
      break
    case 'patient.appointmentBooked':
      component = (
        <AppointmentBookedEmail
          patientName={data.patientName}
          practitionerName={data.practitionerName}
          appointmentDate={data.appointmentDate}
          appointmentTime={data.appointmentTime}
          appointmentLink={data.appointmentLink}
        />
      )
      break
    case 'patient.appointmentCancelled':
      component = (
        <AppointmentCancelledEmail
          patientName={data.patientName}
          practitionerName={data.practitionerName}
          appointmentDate={data.appointmentDate}
        />
      )
      break
    case 'patient.prescriptionReady':
      component = (
        <PrescriptionReadyEmail
          patientName={data.patientName}
          prescriptionLink={data.prescriptionLink}
        />
      )
      break

    case 'practitioner.applicationReceived':
      component = <PractitionerApplicationReceivedEmail practitionerName={data.practitionerName} />
      break
    case 'practitioner.accountApproved':
      component = (
        <PractitionerAccountApprovedEmail
          practitionerName={data.practitionerName}
          loginLink={data.loginLink}
        />
      )
      break
    case 'practitioner.profileSetupInvitation':
      component = (
        <PractitionerProfileSetupInvitationEmail
          doctorName={data.doctorName}
          clinicName={data.clinicName}
          loginLink={data.loginLink}
          profileUpdateLink={data.profileUpdateLink}
        />
      )
      break
    case 'practitioner.reapprovalReminder':
      component = (
        <PractitionerReapprovalReminderEmail
          practitionerName={data.practitionerName}
          deadlineDate={data.deadlineDate}
        />
      )
      break

    case 'clinic.applicationReceived':
      component = <ClinicApplicationReceivedEmail clinicName={data.clinicName} />
      break
    case 'clinic.accountApproved':
      component = (
        <ClinicAccountApprovedEmail clinicName={data.clinicName} loginLink={data.loginLink} />
      )
      break
    case 'clinic.documentRenewalReminder':
      component = (
        <ClinicDocumentRenewalReminderEmail
          clinicName={data.clinicName}
          deadlineDate={data.deadlineDate}
          uploadLink={data.uploadLink}
        />
      )
      break

    case 'admin.newPractitioner':
      component = (
        <AdminNewPractitionerEmail
          practitionerName={data.practitionerName}
          adminLink={data.adminLink}
        />
      )
      break
    case 'admin.newClinic':
      component = <AdminNewClinicEmail clinicName={data.clinicName} adminLink={data.adminLink} />
      break
    case 'admin.documentExpiryAlert':
      component = (
        <AdminDocumentExpiryAlertEmail
          entityName={data.entityName}
          documentType={data.documentType}
          expiryDate={data.expiryDate}
        />
      )
      break
    case 'admin.teamMemberCredentials':
      component = (
        <AdminTeamMemberCredentialsEmail
          name={data.name}
          email={data.email}
          password={data.password}
          roleName={data.roleName}
          loginLink={data.loginLink}
        />
      )
      break
  }

  return await render(component)
}
