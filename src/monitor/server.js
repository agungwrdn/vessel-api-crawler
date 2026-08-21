const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { createMonitorStore } = require('./store')

const HTML_PATH = path.join(__dirname, 'public', 'index.html')
const DEFAULT_PORT = Number(process.env.MONITOR_PORT || 3000)
const DEFAULT_HOST = process.env.MONITOR_HOST || '127.0.0.1'

function jsonResponse(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

function createServer({ store, port = DEFAULT_PORT, host = DEFAULT_HOST } = {}) {
  if (!store) throw new Error('Monitor store belum diisi')
  const dashboard = fs.readFileSync(HTML_PATH, 'utf8')
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`)

    try {
      if (request.method === 'GET' && url.pathname === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        response.end(dashboard)
        return
      }
      if (request.method === 'GET' && url.pathname === '/api/jobs') {
        jsonResponse(response, 200, await store.listJobs())
        return
      }
      if (request.method === 'GET' && url.pathname === '/api/runs') {
        const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '100', 10)
        jsonResponse(response, 200, await store.listRuns(Number.isFinite(requestedLimit) ? requestedLimit : 100))
        return
      }
      if (request.method === 'GET' && url.pathname === '/api/health') {
        jsonResponse(response, 200, await store.health())
        return
      }
      jsonResponse(response, 404, { error: 'Not found' })
    } catch (error) {
      jsonResponse(response, 500, { error: error.message })
    }
  })

  server.monitorPort = port
  server.monitorHost = host
  return server
}

function startServer({ store = createMonitorStore(), port = DEFAULT_PORT, host = DEFAULT_HOST } = {}) {
  const server = createServer({ store, port, host })
  server.listen(port, host, () => console.log(`Job monitor berjalan di http://${host}:${port}`))
  return server
}

if (require.main === module) startServer()

module.exports = { createServer, startServer }
