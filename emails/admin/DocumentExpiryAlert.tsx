/** @jsxImportSource react */
import * as React from 'react'
import { Text } from '@react-email/components'
import { Layout } from '../components/Layout'

export function AdminDocumentExpiryAlertEmail(props: {
  entityName: string
  documentType: string
  expiryDate: string
}) {
  return (
    <Layout title="Upcoming Expiry: Practitioner or Clinic Regulatory Document">
      <Text>Admin,</Text>
      <Text>The following document is expiring soon:</Text>
      <Text>
        <ul>
          <li>
            <strong>Entity:</strong> {props.entityName}
          </li>
          <li>
            <strong>Document Type:</strong> {props.documentType}
          </li>
          <li>
            <strong>Expiry Date:</strong> {props.expiryDate}
          </li>
        </ul>
      </Text>
      <Text>Review or remind the entity to update.</Text>
      <Text>Azina Health Compliance System</Text>
    </Layout>
  )
}


