import type { AppOpenAPI } from '~/types'
import { API_START_POINT } from './config/constants'
import admin_router from './routes/admin'
import clinic_router from './routes/clinic'
import doctor_router from './routes/doctor'
import patient_router from './routes/patient/index'
import storage_router from './routes/storage'
import user_router from './routes/user'
import service_router from './routes/service'

export function registerRoutes(app: AppOpenAPI) {
  try {
    app.route(`${API_START_POINT}/user`, user_router)
    app.route(`${API_START_POINT}/doctor`, doctor_router)
    app.route(`${API_START_POINT}/clinic`, clinic_router)
    app.route(`${API_START_POINT}/patient`, patient_router)
    app.route(`${API_START_POINT}/admin`, admin_router)
    app.route(`${API_START_POINT}/storage`, storage_router)
    app.route(`${API_START_POINT}/services`, service_router)
  } catch (error) {
    console.error('❌ [registerRoutes] Error registering routes:', error)
    throw error
  }

  return app
}
