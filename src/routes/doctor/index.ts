import { createRouter } from '~/lib/create-app'
import { DOCTOR_ROUTE_HANDLER } from '~/routes/doctor/doctor.handler'
import { DOCTOR_ROUTES } from '~/routes/doctor/doctor.routes'
import timeslots_router from '~/routes/doctor/timeslots'

const router = createRouter()

// Register doctor profile routes
Object.entries(DOCTOR_ROUTES).forEach(([key, route]) => {
  const handler = DOCTOR_ROUTE_HANDLER[key as keyof typeof DOCTOR_ROUTE_HANDLER]
  if (route && handler) {
    router.openapi(
      route as Parameters<typeof router.openapi>[0],
      handler as Parameters<typeof router.openapi>[1]
    )
  }
})

// Register timeslot routes
router.route('/timeslots', timeslots_router)

export default router
