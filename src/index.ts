import { cors } from 'hono/cors'
import { registerRoutes } from '~/app'
import { auth } from '~/lib/auth'
import { handleAdminCreateUser } from '~/lib/auth-middleware'
import configureOpenAPI from '~/lib/configure-open-api'
import createApp from '~/lib/create-app'
import { registerEmailListeners } from '~/lib/email/service'
import prisma from '~/lib/prisma'
import { ORIGINS } from './config/origins'

registerEmailListeners()

const app = createApp()

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    c.set('user', null)
    c.set('session', null)
    return next()
  }

  const userWithRole = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
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
  '*',
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

app.use('/doc', async (c, next) => {
  try {
    await next()
    if (c.res.status >= 500) {
      console.error('❌ [doc middleware] Response has 500 status after completion')
      const clonedRes = c.res.clone()
      try {
        const text = await clonedRes.text()
        console.error('❌ [doc middleware] Response body:', text)
      } catch (e) {
        console.error('❌ [doc middleware] Could not read response body:', e)
      }
    }
  } catch (error) {
    console.error('❌ [doc middleware] Error in /doc endpoint:', error)
    throw error
  }
})

try {
  registerRoutes(app)
} catch (error) {
  console.error('❌ [index] Error registering routes:', error)
  throw error
}

try {
  configureOpenAPI(app)
} catch (error) {
  console.error('❌ [index] Error configuring OpenAPI:', error)
  throw error
}

export default {
  fetch: app.fetch,
  port: Bun.env.PORT_NO,
}
