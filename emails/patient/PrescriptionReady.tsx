/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function PrescriptionReadyEmail(props: {
  patientName: string
  prescriptionLink: string
}) {
  return (
    <Layout title="Your Prescription is Ready for Collection or Delivery">
      <Text>Hi {props.patientName},</Text>
      <Text>Your prescription from your recent consultation is now ready.</Text>
      <Button
        href={props.prescriptionLink}
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
        View prescription
      </Button>
      <Text>Thank you for choosing Azina Health.</Text>
    </Layout>
  )
}


