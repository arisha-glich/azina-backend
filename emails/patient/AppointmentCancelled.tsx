/** @jsxImportSource react */
import * as React from 'react'
import { Text } from '@react-email/components'
import { Layout } from '../components/Layout'

export function AppointmentCancelledEmail(props: {
  patientName: string
  practitionerName: string
  appointmentDate: string
}) {
  return (
    <Layout title="Your Appointment Has Been Cancelled">
      <Text>Hi {props.patientName},</Text>
      <Text>
        Your appointment on {props.appointmentDate} with {props.practitionerName} has been cancelled.
      </Text>
      <Text>You can rebook anytime from your account.</Text>
      <Text>
        Best wishes,
        <br />
        Azina Health
      </Text>
    </Layout>
  )
}


