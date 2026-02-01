import { Context } from 'hono'

/**
 * Global error handler middleware
 */
export async function errorHandler(err: Error, c: Context) {
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: c.req.path,
    method: c.req.method
  })

  // Determina o tipo de erro e status code
  let statusCode = 500
  let errorType = 'INTERNAL_SERVER_ERROR'
  let message = 'An unexpected error occurred'

  if (err.message.includes('not found')) {
    statusCode = 404
    errorType = 'NOT_FOUND'
    message = err.message
  } else if (err.message.includes('unauthorized') || err.message.includes('authentication')) {
    statusCode = 401
    errorType = 'UNAUTHORIZED'
    message = 'Authentication required'
  } else if (err.message.includes('forbidden') || err.message.includes('permission')) {
    statusCode = 403
    errorType = 'FORBIDDEN'
    message = 'Insufficient permissions'
  } else if (err.message.includes('validation') || err.message.includes('invalid')) {
    statusCode = 400
    errorType = 'VALIDATION_ERROR'
    message = err.message
  } else if (err.message.includes('conflict') || err.message.includes('duplicate')) {
    statusCode = 409
    errorType = 'CONFLICT'
    message = err.message
  }

  return c.json(
    {
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
      path: c.req.path,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    statusCode
  )
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(c: Context) {
  return c.json(
    {
      error: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      timestamp: new Date().toISOString()
    },
    404
  )
}
