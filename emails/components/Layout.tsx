/** @jsxImportSource react */
import * as React from 'react'
import { Html, Head, Body, Container, Section, Text, Hr } from '@react-email/components'

type LayoutProps = {
  title: string
  children: React.ReactNode
}

export function Layout({ title, children }: LayoutProps): React.JSX.Element {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ fontFamily: 'Arial, Helvetica, sans-serif', backgroundColor: '#f3f4f6' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <Section style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px' }}>
            <Text style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
              🩺 Azina Health
            </Text>
          </Section>
          <Section style={{ padding: '20px', color: '#0f172a', lineHeight: '1.6' }}>
            <Text style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 'bold' }}>
              {title}
            </Text>
            {children}
          </Section>
          <Hr style={{ borderColor: '#e5e7eb', margin: 0 }} />
          <Section style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px' }}>
            <Text style={{ margin: '4px 0', fontSize: '12px' }}>
              You're receiving this email because you have an account with Azina Health.
            </Text>
            <Text style={{ margin: '4px 0', fontSize: '12px' }}>
              If you didn't expect this, you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}


