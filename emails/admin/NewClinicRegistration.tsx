/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function AdminNewClinicEmail(props: { clinicName: string; adminLink: string }) {
  return (
    <Layout title="New Clinic Application Pending Approval">
      <Text>Admin Team,</Text>
      <Text>
        A new clinic, <strong>{props.clinicName}</strong>, has registered and requires approval.
      </Text>
      <Button
        href={props.adminLink}
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
        Review now
      </Button>
      <Text>Azina Health System Notification</Text>
    </Layout>
  )
}


