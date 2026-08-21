const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')

const { createServer } = require('./server')

function request(server, pathname) {
  const address = server.address()
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: address.port, path: pathname }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => resolve({ statusCode: response.statusCode, headers: response.headers, body }))
    }).on('error', reject)
  })
}

test('serves dashboard and monitor JSON endpoints', async () => {
  const store = {
    listJobs: async () => [{ job_name: 'tracking', status: 'success' }],
    listRuns: async (limit) => [{ id: 1, limit, phases: [] }],
    health: async () => ({ ok: true }),
  }
  const server = createServer({ store })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  try {
    const html = await request(server, '/')
    const jobs = await request(server, '/api/jobs')
    const runs = await request(server, '/api/runs?limit=5')
    const health = await request(server, '/api/health')
    const missing = await request(server, '/unknown')

    assert.equal(html.statusCode, 200)
    assert.match(html.headers['content-type'], /text\/html/)
    assert.match(html.body, /Job Monitoring/)
    assert.deepEqual(JSON.parse(jobs.body), [{ job_name: 'tracking', status: 'success' }])
    assert.equal(JSON.parse(runs.body)[0].limit, 5)
    assert.deepEqual(JSON.parse(health.body), { ok: true })
    assert.equal(missing.statusCode, 404)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
