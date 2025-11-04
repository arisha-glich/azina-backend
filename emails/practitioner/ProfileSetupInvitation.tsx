/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function PractitionerProfileSetupInvitationEmail(props: {
  doctorName: string
  clinicName: string
  loginLink: string
  profileUpdateLink: string
}) {
  return (
    <Layout title="Welcome to Azina Health — Complete Your Doctor Profile">
      <Text>Dear {props.doctorName},</Text>
      <Text>
        We're excited to welcome you to <strong>{props.clinicName}</strong> as part of our healthcare network.
      </Text>
      <Text>
        Your account has been created successfully. To get started and begin accepting patients, please complete your doctor profile by adding your professional details, documents, and preferences.
      </Text>
      <Button
        href={props.profileUpdateLink}
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
        Update Your Profile
      </Button>
      <Text>
        If you have any questions or need assistance, please don't hesitate to contact us.
      </Text>
      <Text>
        Welcome aboard!
        <br />
        The Azina Health Team
      </Text>
    </Layout>
  )
}

