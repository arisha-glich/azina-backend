/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from './components/Layout'

export function GenericWelcomeEmail(props: { name: string; role: string; loginLink: string }): React.JSX.Element {
  const roleLabel = props.role === 'CLINIC' ? 'Clinic' : props.role === 'DOCTOR' ? 'Practitioner' : 'User'

  return (
    <Layout title="Welcome to Azina Health — Your Digital Health Partner">
      <Text>Hi {props.name},</Text>
      <Text>
        Welcome to Azina Health! Your {roleLabel} account has been successfully created. You can now access your dashboard, manage your profile, and start using our comprehensive healthcare platform.
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

