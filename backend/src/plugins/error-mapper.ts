import type { FastifyError, FastifyInstance } from 'fastify'

// Called directly on the root instance (not via app.register) so the
// handlers apply to every route regardless of encapsulation context.
export function errorMapper(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError, _request, reply) => {
    const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500

    if (statusCode >= 500) {
      app.log.error(err)
    }

    reply.status(statusCode).send({
      error: {
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : (err.code ?? 'BAD_REQUEST'),
        message: statusCode >= 500 ? 'Internal server error' : err.message,
      },
    })
  })

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    })
  })
}
