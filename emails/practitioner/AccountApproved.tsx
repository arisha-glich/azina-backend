/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function PractitionerAccountApprovedEmail(props: { practitionerName: string; loginLink: string }) {
  return (
    <Layout title="Your Azina Health Practitioner Account Has Been Approved">
      <Text>Dear {props.practitionerName},</Text>
      <Text>Congratulations! Your account has been approved. You can now log in and start accepting appointments.</Text>
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
        Access your dashboard
      </Button>
      <Text>
        We're excited to have you on board.
        <br />
        The Azina Health Team
      </Text>
    </Layout>
  )
}


