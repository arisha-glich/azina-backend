import type { AppOpenAPI } from '~/types'
import { API_START_POINT } from './config/constants'
import admin_router from './routes/admin'
import clinic_router from './routes/clinic'
import doctor_router from './routes/doctor'
import user_router from './routes/user'

export function registerRoutes(app: AppOpenAPI) {
  return app
    .route(`${API_START_POINT}/user`, user_router)
    .route(`${API_START_POINT}/doctor`, doctor_router)
    .route(`${API_START_POINT}/clinic`, clinic_router)
    .route(`${API_START_POINT}/admin`, admin_router)
}
