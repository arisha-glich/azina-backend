import { cors } from 'hono/cors'
import { registerRoutes } from '~/app'
import { auth } from '~/lib/auth'
import { handleAdminCreateUser } from '~/lib/auth-middleware'
import configureOpenAPI from '~/lib/configure-open-api'
import createApp from '~/lib/create-app'
import { registerEmailListeners } from '~/lib/email/service'
import prisma from '~/lib/prisma'
import { ORIGINS } from './config/origins'

// Register email event listeners (includes React Email templates)
registerEmailListeners()

// parseENV()
const app = createApp()

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    c.set('user', null)
    c.set('session', null)
    return next()
  }

  // Fetch user from database to ensure role field is included
  // This ensures case-insensitive admin role checking works correctly
  const userWithRole = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true, // Ensure role is included
      roleId: true,
      banned: true,
      banReason: true,
      banExpiresAt: true,
      onboarding_stage: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  c.set('user', userWithRole ? { ...session.user, role: userWithRole.role } : session.user)
  c.set('session', session.session)
  return next()
})
app.use(
  '*', // or replace with "*" to enable cors for all routes
  cors({
    origin: ORIGINS,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)
app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/*', async c => {
  const response = await auth.handler(c.req.raw)
  return handleAdminCreateUser(response, c)
})
registerRoutes(app)
configureOpenAPI(app)
console.log('Auth reference available at http://localhost:8080/api/auth/reference')
console.log('API reference available at http://localhost:8080/reference')

export default {
  fetch: app.fetch,
  port: Bun.env.PORT_NO,
}
