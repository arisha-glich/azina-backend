/** @jsxImportSource react */
import * as React from 'react'
import { Text } from '@react-email/components'
import { Layout } from '../components/Layout'

export function ClinicApplicationReceivedEmail(props: { clinicName: string }) {
  return (
    <Layout title="We've Received Your Clinic Registration">
      <Text>Dear {props.clinicName},</Text>
      <Text>Thank you for registering your clinic with Azina Health. Your application is being reviewed and we'll notify you once it's approved.</Text>
      <Text>
        Best regards,
        <br />
        Azina Health
      </Text>
    </Layout>
  )
}


