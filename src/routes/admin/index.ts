import { createRouter } from '~/lib/create-app'
import { ADMIN_ROUTE_HANDLER } from '~/routes/admin/admin.handler'
import { ADMIN_ROUTES } from '~/routes/admin/admin.routes'

const router = createRouter()

// Register all routes dynamically
// This includes:
// - Approval Request Routes: get_all_requests, get_request_by_id, approve_request, reject_request
// - Role Management Routes: get_roles, create_role, update_role, delete_role
// - Permission Management Routes: get_permissions, create_permission
// - User Role Assignment Routes: assign_role, revoke_role
// - Permission Check Routes: check_permission, get_user_permissions
Object.entries(ADMIN_ROUTES).forEach(([key, route]) => {
  const typedKey = key as keyof typeof ADMIN_ROUTE_HANDLER
  const handler = ADMIN_ROUTE_HANDLER[typedKey]
  if (route && handler) {
    // Types may not be assignable, so we have to assert the type
    router.openapi(
      route as Parameters<typeof router.openapi>[0],
      handler as Parameters<typeof router.openapi>[1]
    )
  }
})

export default router
