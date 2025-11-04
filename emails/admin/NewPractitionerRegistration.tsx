/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function AdminNewPractitionerEmail(props: { practitionerName: string; adminLink: string }) {
  return (
    <Layout title="New Practitioner Application Submitted">
      <Text>Admin Team,</Text>
      <Text>
        A new practitioner, <strong>{props.practitionerName}</strong>, has submitted an application for review.
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
        Review application
      </Button>
      <Text>Azina Health System Notification</Text>
    </Layout>
  )
}


