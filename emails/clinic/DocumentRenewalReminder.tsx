/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function ClinicDocumentRenewalReminderEmail(props: { clinicName: string; deadlineDate: string; uploadLink: string }) {
  return (
    <Layout title="Action Required: Update Your Clinic's Regulatory Documents">
      <Text>Dear {props.clinicName},</Text>
      <Text>
        Please upload updated regulatory documents (e.g., CQC certification, indemnity cover) by <strong>{props.deadlineDate}</strong> to maintain compliance with Azina Health policies.
      </Text>
      <Button
        href={props.uploadLink}
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
        Upload documents
      </Button>
      <Text>
        Thank you,
        <br />
        Azina Health Compliance Team
      </Text>
    </Layout>
  )
}


