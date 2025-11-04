/**
 * Seeded permissions list
 * This is the source of truth for which permissions should exist in the database
 */

export const SEEDED_PERMISSIONS = [
  // User permissions
  { resource: 'user', action: 'create', description: 'Create new users' },
  { resource: 'user', action: 'update', description: 'Update user information' },
  { resource: 'user', action: 'delete', description: 'Delete users' },
  { resource: 'user', action: 'ban', description: 'Ban users' },
  { resource: 'user', action: 'unban', description: 'Unban users' },
  { resource: 'user', action: 'view', description: 'View user details' },
  { resource: 'user', action: 'list', description: 'List all users' },

  // Approval Request permissions
  { resource: 'approval_request', action: 'update', description: 'Update approval requests' },
  { resource: 'approval_request', action: 'delete', description: 'Delete approval requests' },
  { resource: 'approval_request', action: 'view', description: 'View approval request details' },

  // Subscription permissions
  { resource: 'subscription', action: 'create', description: 'Create subscriptions' },
  { resource: 'subscription', action: 'update', description: 'Update subscriptions' },
  { resource: 'subscription', action: 'delete', description: 'Delete subscriptions' },
  { resource: 'subscription', action: 'view', description: 'View subscription details' },
  { resource: 'subscription', action: 'list', description: 'List all subscriptions' },

  // Receive Payment permissions
  { resource: 'recieve_payment', action: 'update', description: 'Update receive payment records' },
  { resource: 'recieve_payment', action: 'delete', description: 'Delete receive payment records' },
  { resource: 'recieve_payment', action: 'view', description: 'View receive payment details' },
  { resource: 'recieve_payment', action: 'list', description: 'List all receive payments' },

  // Reviews permissions
  { resource: 'reviews', action: 'delete', description: 'Delete reviews' },
  { resource: 'reviews', action: 'view', description: 'View review details' },
  { resource: 'reviews', action: 'list', description: 'List all reviews' },

  // User Query permissions
  { resource: 'user_query', action: 'delete', description: 'Delete user queries' },
  { resource: 'user_query', action: 'view', description: 'View user query details' },
  { resource: 'user_query', action: 'list', description: 'List all user queries' },

  // Settings permissions
  { resource: 'settings', action: 'view', description: 'View settings' },
  { resource: 'settings', action: 'update', description: 'Update settings' },
] as const

// Create a Set for quick lookup
export const SEEDED_PERMISSIONS_SET = new Set(
  SEEDED_PERMISSIONS.map(p => `${p.resource}:${p.action}`)
)

// Helper function to check if a permission is seeded
export function isSeededPermission(resource: string, action: string): boolean {
  return SEEDED_PERMISSIONS_SET.has(`${resource}:${action}`)
}
