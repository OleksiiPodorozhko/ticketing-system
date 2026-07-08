import { resolve } from 'node:path'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { errorMapper } from './plugins/error-mapper.js'
import { healthRoutes } from './routes/health.js'

const app = Fastify({ logger: true })

errorMapper(app)
healthRoutes(app)

// Compose runtime only (architecture.md §2): serve the compiled SPA when
// STATIC_DIR is set. Unknown /api/* paths keep the JSON 404 contract.
const staticDir = process.env.STATIC_DIR
if (staticDir) {
  await app.register(fastifyStatic, { root: resolve(staticDir), wildcard: false })
  app.get('/*', (request, reply) => {
    if (request.url.startsWith('/api/')) return reply.callNotFound()
    return reply.sendFile('index.html')
  })
}

const port = Number(process.env.PORT ?? 3000)

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
