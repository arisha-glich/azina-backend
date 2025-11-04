export interface ApprovalRequest {
  id: string
  request_type: string // "DOCTOR" | "CLINIC"
  user_id: string
  entity_id: string
  status: string // "PENDING" | "APPROVED" | "REJECTED"
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  request_data?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
    onboarding_stage: string | null
  }
  // New: the fully-populated entity (doctor/clinic) when returned by admin APIs
  entity?: Record<string, unknown> | null
}

// Helper to safely read the source payload (prefer enriched entity)
export function getApprovalRequestSource(req: ApprovalRequest): Record<string, unknown> {
  return (
    (req?.entity as Record<string, unknown> | undefined) ??
    (req?.request_data as Record<string, unknown> | undefined) ??
    {}
  )
}
