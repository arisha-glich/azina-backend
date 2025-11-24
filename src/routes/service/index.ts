import { createRouter } from '~/lib/create-app'
import { SERVICE_ROUTE_HANDLER } from '~/routes/service/service.handler'
import { SERVICE_ROUTES } from '~/routes/service/service.routes'

const router = createRouter()

for (const [key, route] of Object.entries(SERVICE_ROUTES)) {
  const handler = SERVICE_ROUTE_HANDLER[key as keyof typeof SERVICE_ROUTE_HANDLER]
  if (route && handler) {
    router.openapi(route, handler)
  }
}

export default router


