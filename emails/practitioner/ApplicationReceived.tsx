/** @jsxImportSource react */
import * as React from 'react'
import { Text } from '@react-email/components'
import { Layout } from '../components/Layout'

export function PractitionerApplicationReceivedEmail(props: { practitionerName: string }) {
  return (
    <Layout title="We've Received Your Practitioner Application">
      <Text>Dear {props.practitionerName},</Text>
      <Text>
        Thank you for applying to join the Azina Health network. We've received your details and they are now under review. You'll receive an update once your application is approved.
      </Text>
      <Text>
        Best regards,
        <br />
        Azina Health Team
      </Text>
    </Layout>
  )
}


