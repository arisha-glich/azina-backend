# Email Management System Documentation

## Overview

The Azina Healthcare backend uses an **event-driven architecture** with **React Email** for managing and sending emails. The system is built on:

- **Event Emitter Pattern**: Decoupled email sending using Node.js EventEmitter
- **React Email**: Modern, component-based email templates
- **Nodemailer**: SMTP email delivery

This architecture provides:
- ✅ Decoupled email logic from business logic
- ✅ Type-safe email templates
- ✅ Easy to test and maintain
- ✅ Support for multiple email templates
- ✅ Error handling and logging

---

## Architecture

### 1. Event Emitter (`src/lib/event-emitter.ts`)

The core of the email system is a typed EventEmitter that manages all email-related events.

```typescript
import { appEventEmitter } from '~/lib/event-emitter'

// Emit an email event
appEventEmitter.emitSendMail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<html>...</html>'
})
```

**Key Features:**
- Typed event methods for type safety
- Multiple event types (mail, notifications, bulk operations)
- Error handling events
- Batch operations support

### 2. Email Service Layer

#### Base Email Service (`src/services/email.service.ts`)
- Handles SMTP connection via Nodemailer
- Registers event listeners for `mail:send` events
- Manages email delivery

#### Email Helpers (`src/lib/email/service.ts`)
- High-level helper functions for common email types
- Integrates React Email templates
- Registers template-based email listeners

### 3. React Email Templates (`emails/`)

Email templates are React components that get rendered to HTML.

**Location:** `emails/` directory

**Structure:**
```
emails/
├── components/
│   └── Layout.tsx          # Shared email layout
├── patient/
│   ├── WelcomeEmail.tsx
│   ├── AppointmentBooked.tsx
│   ├── AppointmentCancelled.tsx
│   └── PrescriptionReady.tsx
├── practitioner/
│   ├── ApplicationReceived.tsx
│   ├── AccountApproved.tsx
│   ├── ProfileSetupInvitation.tsx
│   └── ReapprovalReminder.tsx
├── clinic/
│   ├── ApplicationReceived.tsx
│   ├── AccountApproved.tsx
│   └── DocumentRenewalReminder.tsx
├── admin/
│   ├── NewPractitionerRegistration.tsx
│   ├── NewClinicRegistration.tsx
│   ├── DocumentExpiryAlert.tsx
│   └── TeamMemberCredentials.tsx
└── GenericWelcomeEmail.tsx
```

---

## How It Works

### Flow Diagram

```
Business Logic
    ↓
Emit Event (appEventEmitter.emitSendMail)
    ↓
Event Listener (registerEmailListeners)
    ↓
Render React Email Template (renderEmailTemplate)
    ↓
Convert to HTML (@react-email/components)
    ↓
Send via Nodemailer (SMTP)
    ↓
Email Delivered
```

### Step-by-Step Process

1. **Business logic emits an event:**
   ```typescript
   import { emailHelpers } from '~/lib/email/service'

   await emailHelpers.sendWelcomeEmail('user@example.com', {
     patientName: 'John Doe',
     loginLink: 'https://app.azina.com/login'
   })
   ```

2. **Event listener catches the event:**
   - The `mail:send-template` event is caught
   - Template is resolved from the event data

3. **React Email renders the template:**
   ```typescript
   // src/lib/email/render.tsx
   const html = await renderEmailTemplate('patient.welcome', {
     patientName: 'John Doe',
     loginLink: 'https://app.azina.com/login'
   })
   ```

4. **Email is sent via SMTP:**
   - Nodemailer sends the rendered HTML email
   - Errors are caught and emitted as `mail:error` events

---

## Available Email Templates

### Patient Emails

| Template ID | Component | Description |
|------------|-----------|-------------|
| `patient.welcome` | `WelcomeEmail` | Welcome email for new patients |
| `patient.appointmentBooked` | `AppointmentBookedEmail` | Confirmation when appointment is booked |
| `patient.appointmentCancelled` | `AppointmentCancelledEmail` | Notification when appointment is cancelled |
| `patient.prescriptionReady` | `PrescriptionReadyEmail` | Notification when prescription is ready |

### Practitioner Emails

| Template ID | Component | Description |
|------------|-----------|-------------|
| `practitioner.applicationReceived` | `PractitionerApplicationReceivedEmail` | Confirmation of application submission |
| `practitioner.accountApproved` | `PractitionerAccountApprovedEmail` | Notification of account approval |
| `practitioner.profileSetupInvitation` | `PractitionerProfileSetupInvitationEmail` | Invitation to complete profile |
| `practitioner.reapprovalReminder` | `PractitionerReapprovalReminderEmail` | Reminder for document reapproval |

### Clinic Emails

| Template ID | Component | Description |
|------------|-----------|-------------|
| `clinic.applicationReceived` | `ClinicApplicationReceivedEmail` | Confirmation of clinic registration |
| `clinic.accountApproved` | `ClinicAccountApprovedEmail` | Notification of clinic approval |
| `clinic.documentRenewalReminder` | `ClinicDocumentRenewalReminderEmail` | Reminder for document renewal |

### Admin Emails

| Template ID | Component | Description |
|------------|-----------|-------------|
| `admin.newPractitioner` | `AdminNewPractitionerEmail` | Notification of new practitioner application |
| `admin.newClinic` | `AdminNewClinicEmail` | Notification of new clinic registration |
| `admin.documentExpiryAlert` | `AdminDocumentExpiryAlertEmail` | Alert for upcoming document expiry |
| `admin.teamMemberCredentials` | `AdminTeamMemberCredentialsEmail` | Credentials for new team members |

### Generic Emails

| Template ID | Component | Description |
|------------|-----------|-------------|
| `generic.welcome` | `GenericWelcomeEmail` | Generic welcome email for any role |

---

## Usage Examples

### 1. Using Email Helpers (Recommended)

The easiest way to send emails is using the `emailHelpers` object:

```typescript
import { emailHelpers } from '~/lib/email/service'

// Send welcome email to patient
await emailHelpers.sendWelcomeEmail('patient@example.com', {
  patientName: 'John Doe',
  loginLink: 'https://app.azina.com/login'
})

// Send appointment confirmation
await emailHelpers.sendAppointmentBooked('patient@example.com', {
  patientName: 'John Doe',
  practitionerName: 'Dr. Smith',
  appointmentDate: '2024-12-01',
  appointmentTime: '10:00 AM',
  appointmentLink: 'https://app.azina.com/appointments/123'
})

// Send practitioner approval
await emailHelpers.sendPractitionerAccountApproved('doctor@example.com', {
  practitionerName: 'Dr. Smith',
  loginLink: 'https://app.azina.com/login'
})
```

### 2. Using Event Emitter Directly

For more control, you can emit events directly:

```typescript
import { appEventEmitter } from '~/lib/event-emitter'

// Send custom email
appEventEmitter.emitSendMail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<html><body><p>Custom HTML content</p></body></html>'
})

// Send template-based email
appEventEmitter.emit('mail:send-template', {
  to: 'user@example.com',
  template: 'patient.welcome',
  payload: {
    patientName: 'John Doe',
    loginLink: 'https://app.azina.com/login'
  }
})
```

### 3. Using Base Email Service

For direct email sending without events:

```typescript
import { emailService } from '~/lib/email/service'

await emailService.send({
  to: 'user@example.com',
  subject: 'Direct Email',
  html: '<html><body><p>Direct email content</p></body></html>'
})
```

---

## Creating New Email Templates

### Step 1: Create React Email Component

Create a new file in the appropriate directory (e.g., `emails/patient/NewTemplate.tsx`):

```typescript
/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function NewTemplateEmail(props: {
  userName: string
  actionLink: string
}) {
  return (
    <Layout title="Your Email Title">
      <Text>Hi {props.userName},</Text>
      <Text>Your email content goes here.</Text>
      <Button
        href={props.actionLink}
        style={{
          display: 'inline-block',
          padding: '10px 16px',
          backgroundColor: '#556cd6',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          margin: '16px 0',
        }}
      >
        Click Here
      </Button>
    </Layout>
  )
}
```

### Step 2: Export the Component

Add to `emails/index.ts`:

```typescript
export { NewTemplateEmail } from './patient/NewTemplate'
```

### Step 3: Register in Render Function

Add to `src/lib/email/render.tsx`:

```typescript
import { NewTemplateEmail } from '../../../emails'

// Add to EmailTemplate type
export type EmailTemplate =
  | 'patient.welcome'
  | 'patient.newTemplate'  // Add this
  | // ... other templates

// Add to emailSubjects
export const emailSubjects: Record<EmailTemplate, string> = {
  // ... existing subjects
  'patient.newTemplate': 'Your Email Subject',
}

// Add to renderEmailTemplate switch
case 'patient.newTemplate':
  component = (
    <NewTemplateEmail
      userName={data.userName}
      actionLink={data.actionLink}
    />
  )
  break
```

### Step 4: Create Helper Function (Optional)

Add to `src/lib/email/service.ts`:

```typescript
export const emailHelpers = {
  // ... existing helpers
  async sendNewTemplate(
    to: string,
    payload: { userName: string; actionLink: string }
  ) {
    appEventEmitter.emit('mail:send-template', {
      to,
      template: 'patient.newTemplate',
      payload,
    })
  },
}
```

---

## Configuration

### Environment Variables

Set these environment variables for email functionality:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # SMTP server host
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for SSL, false for TLS
SMTP_USER=your-email@gmail.com    # SMTP username
SMTP_PASS=your-app-password       # SMTP password or app password

# Alternative variable names (for compatibility)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Email From Address
EMAIL_FROM=Azina Healthcare <noreply@azina.com>
SMTP_FROM=Azina Healthcare <noreply@azina.com>
```

### Gmail Setup

For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the app password as `SMTP_PASS`

### Initialization

Email listeners are automatically registered when the app starts:

```typescript
// src/index.ts
import { registerEmailListeners } from '~/lib/email/service'

registerEmailListeners()
```

---

## Event Types

### Mail Events

| Event Name | Method | Description |
|-----------|--------|-------------|
| `mail:send` | `emitSendMail()` | Send any email |
| `mail:welcome` | `emitWelcomeMail()` | Send welcome email |
| `mail:password-reset` | `emitPasswordResetMail()` | Send password reset |
| `mail:appointment-confirmation` | `emitAppointmentConfirmationMail()` | Send appointment confirmation |
| `mail:appointment-reminder` | `emitAppointmentReminderMail()` | Send appointment reminder |
| `mail:prescription` | `emitPrescriptionMail()` | Send prescription notification |
| `mail:doctor-approval` | `emitDoctorApprovalMail()` | Send doctor approval |
| `mail:doctor-rejection` | `emitDoctorRejectionMail()` | Send doctor rejection |
| `mail:clinic-approval` | `emitClinicApprovalMail()` | Send clinic approval |
| `mail:clinic-rejection` | `emitClinicRejectionMail()` | Send clinic rejection |
| `mail:error` | `emitMailError()` | Email error occurred |

### Notification Events

The system also supports in-app notifications:

```typescript
appEventEmitter.emitCreateNotification({
  userId: 'user-id',
  type: 'APPOINTMENT_CREATED',
  title: 'Appointment Created',
  message: 'Your appointment has been scheduled',
  priority: 'MEDIUM',
  channels: ['IN_APP', 'EMAIL']
})
```

---

## Error Handling

### Email Errors

Email errors are automatically caught and emitted:

```typescript
appEventEmitter.onMailError(({ error, eventData }) => {
  console.error('Mail error occurred:', error)
  console.error('Failed email data:', eventData)
  // Handle error (log, retry, notify admin, etc.)
})
```

### Common Issues

1. **SMTP Connection Failed**
   - Check SMTP credentials
   - Verify SMTP host and port
   - Check firewall/network settings

2. **Template Rendering Error**
   - Verify template exists in `render.tsx`
   - Check template props match payload
   - Ensure React Email components are used correctly

3. **Email Not Received**
   - Check spam folder
   - Verify recipient email address
   - Check SMTP logs for delivery status

---

## Testing

### Testing Email Templates

You can test email templates locally:

```typescript
import { renderEmailTemplate } from '~/lib/email/render'

const html = await renderEmailTemplate('patient.welcome', {
  patientName: 'Test User',
  loginLink: 'https://app.azina.com/login'
})

console.log(html) // View rendered HTML
```

### Testing Email Sending

Use a test SMTP service like [Mailtrap](https://mailtrap.io/) or [Ethereal Email](https://ethereal.email/):

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
```

---

## Best Practices

1. **Always use email helpers** when available - they provide type safety and consistency
2. **Use React Email templates** for all user-facing emails - ensures consistent styling
3. **Handle errors gracefully** - log errors and provide fallbacks
4. **Test templates** before deploying - verify rendering and links
5. **Use environment variables** for SMTP configuration - never hardcode credentials
6. **Monitor email delivery** - track bounce rates and delivery failures
7. **Keep templates simple** - complex layouts may not render well in all email clients

---

## File Structure

```
src/
├── lib/
│   ├── event-emitter.ts          # Event emitter with typed events
│   └── email/
│       ├── service.ts             # Email helpers and template listeners
│       └── render.tsx             # React Email template rendering
├── services/
│   └── email.service.ts           # Base email service (SMTP)
└── index.ts                       # App initialization (registers listeners)

emails/
├── components/
│   └── Layout.tsx                 # Shared email layout component
├── patient/                       # Patient email templates
├── practitioner/                  # Practitioner email templates
├── clinic/                        # Clinic email templates
├── admin/                         # Admin email templates
├── GenericWelcomeEmail.tsx        # Generic welcome template
└── index.ts                       # Template exports
```

---

## Additional Resources

- [React Email Documentation](https://react.email/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Node.js EventEmitter](https://nodejs.org/api/events.html)

---

## Support

For issues or questions about the email system:
1. Check the error logs in the console
2. Verify SMTP configuration
3. Test email template rendering
4. Review this documentation

---

**Last Updated:** November 2024


