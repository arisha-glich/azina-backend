import { createRouter } from '~/lib/create-app'
import { BOOKING_ROUTE_HANDLER } from '~/routes/patient/booking/booking.handler'
import { BOOKING_ROUTES } from '~/routes/patient/booking/booking.routes'

const router = createRouter()

for (const [key, route] of Object.entries(BOOKING_ROUTES)) {
  const handler = BOOKING_ROUTE_HANDLER[key as keyof typeof BOOKING_ROUTE_HANDLER]
  if (route && handler) {
    router.openapi(route, handler)
  }
}

export default router

