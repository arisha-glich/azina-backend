import { createRouter } from '~/lib/create-app'
import { PATIENT_ROUTE_HANDLER } from '~/routes/patient/patient.handler'
import { PATIENT_ROUTES } from '~/routes/patient/patient.routes'

const router = createRouter()

for (const [key, route] of Object.entries(PATIENT_ROUTES)) {
  const handler = PATIENT_ROUTE_HANDLER[key as keyof typeof PATIENT_ROUTE_HANDLER]
  if (route && handler) {
    router.openapi(route, handler)
  }
}

export default router


