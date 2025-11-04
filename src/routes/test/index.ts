import { createRouter } from '~/lib/create-app'
import { TEST_ROUTE_HANDLER } from '~/routes/test/test.handler'
import { TEST_ROUTES } from '~/routes/test/test.routes'

const router = createRouter()

// Register all routes dynamically
for (const [key, route] of Object.entries(TEST_ROUTES)) {
  const handler = TEST_ROUTE_HANDLER[key as keyof typeof TEST_ROUTE_HANDLER]
  if (route && handler) {
    router.openapi(route, handler)
  }
}

export default router
