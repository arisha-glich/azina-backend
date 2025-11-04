import { createRouter } from '~/lib/create-app'
import { USER_ROUTE_HANDLER } from '~/routes/user/user.handler'
import { USER_ROUTES } from '~/routes/user/user.routes'

const router = createRouter()

// Register all routes dynamically
for (const [key, route] of Object.entries(USER_ROUTES)) {
  const handler = USER_ROUTE_HANDLER[key as keyof typeof USER_ROUTE_HANDLER]
  if (route && handler) {
    router.openapi(route, handler)
  }
}

export default router
