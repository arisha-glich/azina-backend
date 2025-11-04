/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function ClinicAccountApprovedEmail(props: { clinicName: string; loginLink: string }) {
  return (
    <Layout title="Your Clinic Account Has Been Approved">
      <Text>Dear {props.clinicName},</Text>
      <Text>
        We're happy to confirm that your clinic account has been approved. You can now access your dashboard to manage practitioners, bookings, and patient records.
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
        Login here
      </Button>
      <Text>
        Warm regards,
        <br />
        The Azina Health Team
      </Text>
    </Layout>
  )
}


