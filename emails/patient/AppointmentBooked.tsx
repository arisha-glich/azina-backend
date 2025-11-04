/** @jsxImportSource react */
import * as React from 'react'
import { Text, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export function AppointmentBookedEmail(props: {
  patientName: string
  practitionerName: string
  appointmentDate: string
  appointmentTime: string
  appointmentLink: string
}) {
  return (
    <Layout title="Your Appointment Has Been Successfully Booked">
      <Text>Hi {props.patientName},</Text>
      <Text>
        Your appointment with {props.practitionerName} has been booked for {props.appointmentDate} at {props.appointmentTime}.
      </Text>
      <Button
        href={props.appointmentLink}
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
        Join session
      </Button>
      <Text>Need to make changes? You can reschedule or cancel via your dashboard.</Text>
      <Text>
        Best,
        <br />
        Azina Health
      </Text>
    </Layout>
  )
}


