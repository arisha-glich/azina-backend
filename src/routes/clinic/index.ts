import { createRouter } from '~/lib/create-app'
import { CLINIC_ROUTE_HANDLER } from '~/routes/clinic/clinic.handler'
import { CLINIC_ROUTES } from '~/routes/clinic/clinic.routes'

const router = createRouter()

// Register all routes dynamically
for (const [key, route] of Object.entries(CLINIC_ROUTES)) {
  const handler = CLINIC_ROUTE_HANDLER[key as keyof typeof CLINIC_ROUTE_HANDLER]
  if (route && handler) {
    router.openapi(route, handler)
  }
}

export default router
