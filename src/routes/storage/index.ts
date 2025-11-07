import { OpenAPIHono } from '@hono/zod-openapi'
import { API_START_POINT } from '~/config/constants'
import type { AppBindings } from '~/types'
import { STORAGE_ROUTES } from './storage.routes'
import { STORAGE_ROUTE_HANDLER } from './storage.handler'

const storageRouter = new OpenAPIHono<AppBindings>()

// Register all storage routes
try {
  Object.entries(STORAGE_ROUTES).forEach(([key, route]) => {
    const handler = STORAGE_ROUTE_HANDLER[key as keyof typeof STORAGE_ROUTE_HANDLER]
    if (route && handler) {
      storageRouter.openapi(
        route as Parameters<typeof storageRouter.openapi>[0],
        handler as Parameters<typeof storageRouter.openapi>[1]
      )
    }
  })
} catch (error) {
  console.error('❌ [storage/index] Error registering storage routes:', error)
  throw error
}

export default storageRouter

