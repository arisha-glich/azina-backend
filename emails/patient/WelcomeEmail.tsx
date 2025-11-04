/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function WelcomeEmail(props: { patientName: string; loginLink: string }): React.JSX.Element {
  return (
    <Layout title="Welcome to Azina Health — Your Digital Health Partner">
      <Text>Hi {props.patientName},</Text>
      <Text>
        Welcome to Azina Health! Your account has been successfully created. You can now book appointments, access your medical records, and receive e-prescriptions all in one place.
      </Text>
      <Button
        href={props.loginLink}
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
        Login to your account
      </Button>
      <Text>
        Best regards,
        <br />
        The Azina Health Team
      </Text>
    </Layout>
  )
}


