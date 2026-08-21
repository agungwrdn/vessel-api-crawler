const fs = require('node:fs')
const path = require('node:path')
const sqlite3 = require('sqlite3').verbose()

const DEFAULT_FILENAME = process.env.MONITOR_DB_PATH || path.join(process.cwd(), 'data', 'monitor.sqlite')
const RETENTION_DAYS = 30

function json(value) {
  return value == null ? null : JSON.stringify(value)
}

function createMonitorStore({ filename = DEFAULT_FILENAME } = {}) {
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  const db = new sqlite3.Database(filename)

  const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
  const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => error ? reject(error) : resolve(row))
  })
  const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows))
  })
  const closeDb = () => new Promise((resolve, reject) => db.close((error) => error ? reject(error) : resolve()))

  const ready = run('PRAGMA foreign_keys = ON')
    .then(() => run(`
      CREATE TABLE IF NOT EXISTS job_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_name TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        duration_ms INTEGER,
        message TEXT,
        error_message TEXT,
        details_json TEXT
      )
    `))
    .then(() => run(`
      CREATE TABLE IF NOT EXISTS job_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        phase_name TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        duration_ms INTEGER,
        message TEXT,
        error_message TEXT,
        details_json TEXT,
        FOREIGN KEY (run_id) REFERENCES job_runs(id) ON DELETE CASCADE
      )
    `))
    .then(() => run('CREATE INDEX IF NOT EXISTS idx_job_runs_job_started ON job_runs(job_name, started_at DESC)'))
    .then(() => run('CREATE INDEX IF NOT EXISTS idx_job_phases_run ON job_phases(run_id, started_at)'))
    .then(() => run("DELETE FROM job_runs WHERE started_at < datetime('now', ?) ", [`-${RETENTION_DAYS} days`]))

  async function startRun(jobName, details) {
    await ready
    const startedAt = new Date().toISOString()
    const result = await run(
      'INSERT INTO job_runs (job_name, status, started_at, details_json) VALUES (?, ?, ?, ?)',
      [jobName, 'running', startedAt, json(details)],
    )
    return { runId: result.lastID, startedAt }
  }

  async function startPhase(runId, phaseName, details) {
    await ready
    const startedAt = new Date().toISOString()
    const result = await run(
      'INSERT INTO job_phases (run_id, phase_name, status, started_at, details_json) VALUES (?, ?, ?, ?, ?)',
      [runId, phaseName, 'running', startedAt, json(details)],
    )
    return { phaseId: result.lastID, startedAt }
  }

  async function finishPhase(phaseId, status, payload = {}) {
    await ready
    const finishedAt = new Date().toISOString()
    const phase = await get('SELECT started_at FROM job_phases WHERE id = ?', [phaseId])
    const durationMs = phase ? Math.max(0, new Date(finishedAt) - new Date(phase.started_at)) : null
    await run(
      'UPDATE job_phases SET status = ?, finished_at = ?, duration_ms = ?, message = ?, error_message = ?, details_json = COALESCE(?, details_json) WHERE id = ?',
      [status, finishedAt, durationMs, payload.message || null, payload.errorMessage || null, json(payload.details), phaseId],
    )
  }

  async function finishRun(runId, status, payload = {}) {
    await ready
    const finishedAt = new Date().toISOString()
    const runRecord = await get('SELECT started_at FROM job_runs WHERE id = ?', [runId])
    const durationMs = runRecord ? Math.max(0, new Date(finishedAt) - new Date(runRecord.started_at)) : null
    await run(
      'UPDATE job_runs SET status = ?, finished_at = ?, duration_ms = ?, message = ?, error_message = ?, details_json = COALESCE(?, details_json) WHERE id = ?',
      [status, finishedAt, durationMs, payload.message || null, payload.errorMessage || null, json(payload.details), runId],
    )
  }

  async function listJobs() {
    await ready
    return all(`
      SELECT r.*
      FROM job_runs r
      INNER JOIN (
        SELECT job_name, MAX(id) AS id
        FROM job_runs
        GROUP BY job_name
      ) latest ON latest.id = r.id
      ORDER BY r.job_name
    `)
  }

  async function listRuns(limit = 100) {
    await ready
    const safeLimit = Math.min(500, Math.max(1, Number.parseInt(limit, 10) || 100))
    const runs = await all('SELECT * FROM job_runs ORDER BY id DESC LIMIT ?', [safeLimit])
    for (const item of runs) {
      item.phases = await all('SELECT * FROM job_phases WHERE run_id = ? ORDER BY id ASC', [item.id])
    }
    return runs
  }

  async function health() {
    await ready
    const row = await get('SELECT 1 AS ok')
    return { ok: row.ok === 1, filename }
  }

  return {
    startRun,
    startPhase,
    finishPhase,
    finishRun,
    listJobs,
    listRuns,
    health,
    close: async () => { await ready; await closeDb() },
  }
}

module.exports = { createMonitorStore }
