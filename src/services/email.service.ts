import * as nodemailer from 'nodemailer'
import type { MailEvent } from '~/lib/event-emitter'
import { appEventEmitter } from '~/lib/event-emitter'

// Get SMTP credentials
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD

// Initialize nodemailer transporter (only if credentials are provided)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  ...(smtpUser && smtpPass
    ? {
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }
    : {}),
})

// Email template renderer
// biome-ignore lint/suspicious/noExplicitAny: Email template data can have various shapes
async function renderEmailTemplate(template: string, data: Record<string, any>): Promise<string> {
  switch (template) {
    case 'welcome':
      return `
        <html>
          <body>
            <h1>Welcome, ${data.name || 'User'}!</h1>
            <p>Thank you for joining Azina Healthcare.</p>
          </body>
        </html>
      `
    case 'password-reset':
      return `
        <html>
          <body>
            <h1>Password Reset</h1>
            <p>Click the link to reset your password: ${data.resetLink || '#'}</p>
          </body>
        </html>
      `
    default:
      return data.html || data.text || '<html><body><p>Email content</p></body></html>'
  }
}

// Send email using nodemailer
async function sendEmail(eventData: MailEvent): Promise<void> {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD

  if (!smtpUser || !smtpPass) {
    console.warn('⚠️  Cannot send email: SMTP credentials not configured')
    throw new Error('Email service not configured: Missing SMTP credentials')
  }

  try {
    let html = eventData.html
    const text = eventData.text

    // If template is provided, render it
    if (eventData.template && eventData.data) {
      html = await renderEmailTemplate(eventData.template, eventData.data)
    }

    const recipients = Array.isArray(eventData.to) ? eventData.to : [eventData.to]

    // Prepare attachments for nodemailer
    const attachments = eventData.attachments?.map(att => ({
      filename: att.filename,
      content: typeof att.content === 'string' ? att.content : att.content,
      contentType: att.contentType,
    }))

    for (const to of recipients) {
      const mailOptions = {
        from:
          process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Azina Healthcare <noreply@azina.com>',
        to,
        subject: eventData.subject,
        html: html || text || '',
        text: text || undefined,
        attachments,
      }

      await transporter.sendMail(mailOptions)
    }

    console.log(`✅ Email sent successfully to ${eventData.to}`)
  } catch (error) {
    console.error('❌ Error sending email:', error)
    appEventEmitter.emitMailError(error as Error, eventData)
    throw error
  }
}

// Verify transporter connection on startup
async function verifyEmailConnection() {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD

  if (!smtpUser || !smtpPass) {
    console.warn(
      '⚠️  Email credentials not configured. Set SMTP_USER and SMTP_PASS environment variables to enable email sending.'
    )
    return
  }

  try {
    await transporter.verify()
    console.log('✅ Email transporter is ready')
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error)
    console.warn('⚠️  Email sending may not work until SMTP credentials are properly configured.')
  }
}

// Register event listeners
export function registerEmailListeners() {
  // Generic mail sender
  appEventEmitter.onSendMail(async (eventData: MailEvent) => {
    try {
      await sendEmail(eventData)
    } catch (error) {
      console.error('Error in mail:send listener:', error)
    }
  })

  // Welcome email
  appEventEmitter.onWelcomeMail(async ({ to, userData }) => {
    try {
      console.log('📬 Welcome email listener triggered for:', to)
      await sendEmail({
        to,
        subject: 'Welcome to Azina Healthcare',
        template: 'welcome',
        data: userData,
      })
      console.log('✅ Welcome email sent successfully to:', to)
    } catch (error) {
      console.error('❌ Error sending welcome email:', error)
    }
  })

  // Password reset email
  appEventEmitter.onPasswordResetMail(async ({ to, resetData }) => {
    try {
      await sendEmail({
        to,
        subject: 'Reset Your Password',
        template: 'password-reset',
        data: resetData,
      })
    } catch (error) {
      console.error('Error sending password reset email:', error)
    }
  })

  // Error handling
  appEventEmitter.onMailError(({ error, eventData }) => {
    console.error('Mail error occurred:', error)
    console.error('Failed email data:', eventData)
  })

  console.log('✅ Email event listeners registered')

  // Verify email connection
  verifyEmailConnection()
}

// Export email service functions for direct use if needed
export const emailService = {
  send: sendEmail,
  renderTemplate: renderEmailTemplate,
}
