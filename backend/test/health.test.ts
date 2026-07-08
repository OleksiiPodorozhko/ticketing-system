import request from 'supertest'
import { describe, expect, it } from 'vitest'

// Runs against the compose stack (docker compose up --build); override the
// target with API_BASE_URL when the stack is published elsewhere.
const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:8080'

describe('GET /api/health', () => {
  it('responds 200 {status:"ok"} on the running stack', async () => {
    const res = await request(baseUrl).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
