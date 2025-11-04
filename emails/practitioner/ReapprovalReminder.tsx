/** @jsxImportSource react */
import * as React from 'react'
import { Text } from '@react-email/components'
import { Layout } from '../components/Layout'

export function PractitionerReapprovalReminderEmail(props: { practitionerName: string; deadlineDate: string }) {
  return (
    <Layout title="Reminder: Submit Updated Regulatory Documents for Reapproval">
      <Text>Dear {props.practitionerName},</Text>
      <Text>This is a reminder to submit your updated regulatory documents (e.g., license, insurance) for annual reapproval.</Text>
      <Text>
        Please upload the documents by <strong>{props.deadlineDate}</strong> to maintain your active status.
      </Text>
      <Text>
        Thank you,
        <br />
        Azina Health Compliance Team
      </Text>
    </Layout>
  )
}


