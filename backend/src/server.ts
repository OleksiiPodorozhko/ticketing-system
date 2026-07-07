import Fastify from 'fastify'
import { errorMapper } from './plugins/error-mapper.js'
import { healthRoutes } from './routes/health.js'

const app = Fastify({ logger: true })

errorMapper(app)
healthRoutes(app)

const port = Number(process.env.PORT ?? 3000)

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
