/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { Layout } from '../components/Layout'

export function AdminTeamMemberCredentialsEmail(props: {
  name: string
  email: string
  password: string
  roleName: string
  loginLink: string
}): React.JSX.Element {
  return (
    <Layout title="Welcome to Azina Health — Your Team Account Credentials">
      <Text>Hi {props.name},</Text>
      <Text>
        Your team member account has been created by an administrator. Below are your login credentials:
      </Text>

      <Section
        style={{
          backgroundColor: '#f6f9fc',
          padding: '16px',
          borderRadius: '8px',
          margin: '16px 0',
        }}
      >
        <Text style={{ margin: '8px 0', fontWeight: 'bold' }}>Email:</Text>
        <Text style={{ margin: '8px 0', fontFamily: 'monospace' }}>{props.email}</Text>

        <Text style={{ margin: '16px 0 8px 0', fontWeight: 'bold' }}>Password:</Text>
        <Text style={{ margin: '8px 0', fontFamily: 'monospace' }}>{props.password}</Text>

        <Text style={{ margin: '16px 0 8px 0', fontWeight: 'bold' }}>Role:</Text>
        <Text style={{ margin: '8px 0' }}>{props.roleName}</Text>
      </Section>

      <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>
        ⚠️ Please save these credentials securely and change your password after your first login.
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

