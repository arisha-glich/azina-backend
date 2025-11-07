import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import * as Phrases from 'stoker/http-status-phrases'
import { ZodError } from 'zod'
import { HttpError } from '~/lib/error'

const onError: ErrorHandler = (err, c) => {
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    name: err.name,
    path: c.req.path,
    method: c.req.method,
  }

  console.error('❌ [error-middleware] Error caught:', errorDetails)

  // Log full error object for debugging
  if (c.req.path === '/doc') {
    console.error('❌ [error-middleware] /doc endpoint error details:', {
      ...errorDetails,
      error: err,
      errorString: String(err),
      errorJSON: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    })
  }

  // 🧩 1. Handle validation errors from Zod (v4)
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          name: 'ZodError',
          message: 'Validation failed',
          issues: err.issues, // ✅ Use "issues" in Zod v4
        },
      },
      HttpStatusCodes.BAD_REQUEST as ContentfulStatusCode
    )
  }

  // 🧩 2. Handle custom HttpError
  if (err instanceof HttpError) {
    return c.json(
      {
        success: false,
        message: err.message,
      },
      err.statusCode as ContentfulStatusCode
    )
  }

  // 🧩 3. Handle other/unexpected errors
  const currentStatus = 'status' in err ? err.status : c.res.status
  const statusCode =
    currentStatus !== HttpStatusCodes.OK
      ? (currentStatus as StatusCode)
      : (HttpStatusCodes.INTERNAL_SERVER_ERROR as StatusCode)

  const env = c.env?.NODE_ENV ?? process.env.NODE_ENV ?? 'development'

  return c.json(
    {
      success: false,
      message: err.message || Phrases.INTERNAL_SERVER_ERROR,
      stack: env === 'production' ? undefined : err.stack,
      ...(c.req.path === '/doc' && env === 'development' ? { errorDetails } : {}),
    },
    statusCode as ContentfulStatusCode
  )
}

export default onError
