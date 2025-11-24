import { createRouter } from '~/lib/create-app'
import { TIMESLOT_ROUTE_HANDLER } from './timeslot.handler'
import { TIMESLOT_ROUTES } from './timeslot.routes'

const router = createRouter()

// Register timeslot routes in a deterministic order to avoid param route shadowing
const order: Array<keyof typeof TIMESLOT_ROUTES> = [
  'create_timeslot',
  'create_bulk_timeslots',
  'get_timeslots',
  'get_timeslot_by_id',
  'update_timeslot',
  'delete_timeslot',
  'delete_all_timeslots',
]

for (const key of order) {
  const route = TIMESLOT_ROUTES[key]
  const handler = TIMESLOT_ROUTE_HANDLER[key]
  if (route && handler) {
    router.openapi(
      route as Parameters<typeof router.openapi>[0],
      handler as Parameters<typeof router.openapi>[1]
    )
  }
}

export default router

