import { createRouter } from '~/lib/create-app'
import { DOCTOR_ROUTE_HANDLER } from '~/routes/doctor/doctor.handler'
import { DOCTOR_ROUTES } from '~/routes/doctor/doctor.routes'

const router = createRouter()

// Register all routes dynamically
for (const [key, route] of Object.entries(DOCTOR_ROUTES)) {
  const handler = DOCTOR_ROUTE_HANDLER[key as keyof typeof DOCTOR_ROUTE_HANDLER]
  if (route && handler) {
    router.openapi(route, handler)
  }
}

export default router
