import request from 'supertest'
import { describe, expect, it } from 'vitest'

// Runs against the compose stack, where STATIC_DIR is set and the app
// serves the compiled SPA alongside /api/* (docs/architecture.md §2).
const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:8080'

describe('SPA static serving with JSON API contract', () => {
  it('serves the SPA shell at /', async () => {
    const res = await request(baseUrl).get('/')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('<div id="root">')
  })

  it('serves the SPA shell for unknown non-API deep links', async () => {
    const res = await request(baseUrl).get('/board')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
  })

  it('keeps the JSON 404 contract for unknown /api/* routes (BR-P04)', async () => {
    const res = await request(baseUrl).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: expect.stringContaining('not found'),
      },
    })
  })
})
