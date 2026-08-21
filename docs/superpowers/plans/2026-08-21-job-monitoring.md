# Job Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan monitoring SQLite dan dashboard HTML yang menampilkan setiap fase, keberhasilan, error, durasi, dan histori seluruh generator/job.

**Architecture:** Job mengirim event ke monitor store yang aman-gagal (monitoring tidak boleh menghentikan job). Store menyimpan run dan phase event di SQLite, sedangkan server HTTP bawaan Node membaca store dan menyajikan dashboard HTML serta endpoint JSON.

**Tech Stack:** Node.js built-in `http`, `sqlite3`, HTML/CSS/vanilla JavaScript, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-21-job-monitoring-design.md`

## Global Constraints

- Database monitoring disimpan di `data/monitor.sqlite`.
- Port default dashboard adalah `3000`; dapat dioverride melalui environment variable.
- Histori lebih dari 30 hari dibersihkan.
- Event tidak boleh menyimpan API key, token, cookie, atau response mentah.
- Kegagalan monitoring tidak boleh menghentikan job utama.
- Semua perubahan produksi mengikuti siklus TDD: test gagal, implementasi minimal, test lulus.

---

### Task 1: SQLite Monitor Store

**Files:**
- Create: `src/monitor/store.js`
- Test: `src/monitor/store.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces `createMonitorStore(options)` returning `{ startRun, startPhase, finishPhase, finishRun, listJobs, listRuns, health, close }`.
- `startRun(jobName, details)` returns `{ runId }`.
- `startPhase(runId, phaseName, details)` returns `{ phaseId }`.
- `finishPhase(phaseId, status, payload)` and `finishRun(runId, status, payload)` persist timestamps, duration, message, error message, and JSON details.
- `listJobs()` returns the latest run summary for each job.
- `listRuns(limit)` returns runs with phase events ordered newest first.

- [ ] **Step 1: Add failing store tests**

  Test an isolated temporary SQLite file for: creating a `running` run, recording a successful phase, recording an error phase, completing a run with duration, listing latest jobs, and retaining error messages/details.

- [ ] **Step 2: Run the store tests and verify the expected failure**

  Run: `node --test src/monitor/store.test.js`

  Expected: FAIL because `src/monitor/store.js` and the SQLite dependency do not exist.

- [ ] **Step 3: Add the SQLite dependency and minimal schema implementation**

  Install `sqlite3`, create `data/` on demand, initialize tables `job_runs` and `job_phases`, and add indexes on job/status/time. Wrap database writes in a safe helper that catches monitor-only failures and resolves without throwing into the job.

- [ ] **Step 4: Run store tests and verify they pass**

  Run: `node --test src/monitor/store.test.js`

  Expected: PASS with run and phase records readable from SQLite.

- [ ] **Step 5: Ignore runtime monitor files**

  Add `data/monitor.sqlite*` to `.gitignore`; do not ignore the `data` directory itself if it needs to exist in a packaged deployment.

- [ ] **Step 6: Commit the store**

  Run: `git add src/monitor/store.js src/monitor/store.test.js package.json package-lock.json .gitignore && git commit -m "feat: add sqlite job monitor store"`

### Task 2: Monitor Event Helper

**Files:**
- Create: `src/monitor/index.js`
- Test: `src/monitor/index.test.js`

**Interfaces:**
- Produces `createMonitor(jobName, store)` returning `{ run, phase, safe }`.
- `run(fn, details)` creates a run, executes `fn(context)`, marks `success` or `error`, and rethrows the original job error.
- `phase(context, phaseName, fn, details)` creates a phase, marks `success` or `error`, and rethrows the original phase error.
- `safe(callback)` executes monitor writes without propagating monitor errors.

- [ ] **Step 1: Add failing helper tests**

  Test that a successful callback produces `running -> success`, a thrown callback produces `running -> error` while preserving the error, and a phase records its message/duration/details.

- [ ] **Step 2: Run the helper tests and verify failure**

  Run: `node --test src/monitor/index.test.js`

  Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement the helper around the store interface from Task 1**

  Ensure monitor write errors are swallowed, while job callback errors are never swallowed.

- [ ] **Step 4: Run helper tests and verify pass**

  Run: `node --test src/monitor/index.test.js`

  Expected: PASS.

- [ ] **Step 5: Commit the helper**

  Run: `git add src/monitor/index.js src/monitor/index.test.js && git commit -m "feat: add job monitor event helper"`

### Task 3: Dashboard HTTP Server and HTML

**Files:**
- Create: `src/monitor/server.js`
- Create: `src/monitor/public/index.html`
- Test: `src/monitor/server.test.js`
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces `createServer({ store, port, host })` and `startServer(options)`.
- Serves `/` with the static dashboard.
- Serves `/api/jobs`, `/api/runs?limit=100`, and `/api/health` as JSON.
- Returns 404 JSON for unknown API paths and does not expose arbitrary filesystem paths.

- [ ] **Step 1: Add failing HTTP endpoint tests**

  Use an in-memory fake store with deterministic jobs/runs/health. Assert status codes, content types, JSON shape, dashboard HTML response, 404 behavior, and limit parsing.

- [ ] **Step 2: Run server tests and verify failure**

  Run: `node --test src/monitor/server.test.js`

  Expected: FAIL because the server module and HTML do not exist.

- [ ] **Step 3: Implement the server and dashboard**

  Use `http.createServer`, serve only the known HTML asset, set JSON/HTML content types, default port `3000`, environment overrides `MONITOR_HOST`, `MONITOR_PORT`, and `MONITOR_DB_PATH`, and expose only the three documented endpoints. The HTML should show job cards, phase rows, error history, and refresh every 10 seconds with vanilla JavaScript.

- [ ] **Step 4: Run server tests and verify pass**

  Run: `node --test src/monitor/server.test.js`

  Expected: PASS.

- [ ] **Step 5: Add the monitor command and environment documentation**

  Add `"monitor": "node src/monitor/server.js"` to `package.json` scripts and add `MONITOR_HOST`, `MONITOR_PORT`, and `MONITOR_DB_PATH` to `.env.example`.

- [ ] **Step 6: Commit dashboard**

  Run: `git add src/monitor/server.js src/monitor/server.test.js src/monitor/public/index.html package.json .env.example && git commit -m "feat: add job monitoring dashboard"`

### Task 4: Instrument Vessel and GPS Jobs

**Files:**
- Modify: `src/jobs/vessel-api-tracking.js`
- Modify: `src/jobs/lancar-berkat-prima-gps.js`
- Modify: `src/jobs/vessel-api-tracking.test.js`
- Modify: `src/jobs/lancar-berkat-prima-gps.test.js`

**Interfaces:**
- Each job emits run and phase events while preserving existing return values, logs, interval behavior, and error isolation.
- Vessel phases include database check, vessel information, VesselAPI position, save position, and Telkomsat fetch/save.
- Lancar phases include partner fetch and save position.

- [ ] **Step 1: Add failing instrumentation assertions**

  Inject a fake monitor into `runOnce` and assert phase names, success events, and failed API phase messages for both jobs.

- [ ] **Step 2: Run the focused tests and verify failure**

  Run: `node --test src/jobs/vessel-api-tracking.test.js src/jobs/lancar-berkat-prima-gps.test.js`

  Expected: FAIL because the jobs do not accept or emit monitor events.

- [ ] **Step 3: Implement injectable monitor contexts and phase wrappers**

  Default to a no-op monitor so existing direct callers remain compatible. Mark partial failures as phase errors while allowing the existing per-vessel/per-source loops to continue.

- [ ] **Step 4: Run focused tests and verify pass**

  Run: `node --test src/jobs/vessel-api-tracking.test.js src/jobs/lancar-berkat-prima-gps.test.js`

  Expected: PASS.

- [ ] **Step 5: Commit instrumentation**

  Run: `git add src/jobs/vessel-api-tracking.js src/jobs/vessel-api-tracking.test.js src/jobs/lancar-berkat-prima-gps.js src/jobs/lancar-berkat-prima-gps.test.js && git commit -m "feat: monitor vessel and gps job phases"`

### Task 5: Instrument Stock and Port Generators

**Files:**
- Modify: `index.js`
- Modify: `generatorPort.js`
- Modify: `src/jobs/stock-broadcast.js`
- Modify: `src/jobs/port-generator.js`
- Create: `src/jobs/stock-broadcast.test.js`
- Create: `src/jobs/port-generator.test.js`

**Interfaces:**
- `broadcastStokReport` and `generatorPort.main` accept an optional monitor context without changing their existing no-argument entrypoints.
- Port generation records Redis connection, each source fetch, Redis write, and final result phases.
- Stock broadcast records report fetch, message broadcast, and final result phases.

- [ ] **Step 1: Add failing generator instrumentation tests**

  Inject fake HTTP/Redis/broadcast dependencies where available and assert that success and caught source errors create the documented phase events.

- [ ] **Step 2: Run generator tests and verify failure**

  Run: `node --test src/jobs/stock-broadcast.test.js src/jobs/port-generator.test.js`

  Expected: FAIL because generator functions do not accept the monitor context or expose phase events.

- [ ] **Step 3: Implement monitor-aware wrappers while preserving existing behavior**

  Keep existing source-level error isolation. Mark the overall run `success` only when the existing function would complete normally; include partial source failures in `details_json`.

- [ ] **Step 4: Run generator tests and verify pass**

  Run: `node --test src/jobs/stock-broadcast.test.js src/jobs/port-generator.test.js`

  Expected: PASS.

- [ ] **Step 5: Commit generator instrumentation**

  Run: `git add index.js generatorPort.js src/jobs/stock-broadcast.js src/jobs/port-generator.js src/jobs/*.test.js && git commit -m "feat: monitor stock and port generator phases"`

### Task 6: Wire Monitor into App and Verify End-to-End

**Files:**
- Modify: `src/app.js`
- Modify: `src/jobs/index.js`
- Modify: `README.md`
- Modify: `src/app.test.js`

**Interfaces:**
- `node src/app.js all` starts all existing jobs with monitoring enabled.
- `npm run monitor` starts only the dashboard server.
- `node src/app.js monitor` resolves to the monitor server without starting duplicate jobs.

- [ ] **Step 1: Add failing app wiring tests**

  Assert the `monitor` command resolves correctly and `all` still exposes all existing jobs.

- [ ] **Step 2: Run app tests and verify failure**

  Run: `node --test src/app.test.js`

  Expected: FAIL because the monitor command is not registered.

- [ ] **Step 3: Wire a shared monitor store into job entrypoints**

  Initialize the store once for the process, pass per-job monitor contexts, and close the store only on process shutdown. Keep monitoring optional when `MONITOR_DISABLED=true`.

- [ ] **Step 4: Update README with operation instructions**

  Document `npm run monitor`, dashboard URL, environment variables, SQLite location, tracked phases, and the fact that monitor failures do not stop jobs.

- [ ] **Step 5: Run the full test suite and static checks**

  Run:

  ```text
  npm test
  node --check src/monitor/store.js
  node --check src/monitor/server.js
  git diff --check
  ```

  Expected: all tests pass and no syntax/whitespace errors occur.

- [ ] **Step 6: Start the dashboard and verify the health endpoint**

  Run `npm run monitor`, then request `http://localhost:3000/api/health` and confirm JSON reports a healthy SQLite connection. Stop the process after verification.

- [ ] **Step 7: Commit final wiring and documentation**

  Run: `git add src/app.js src/jobs/index.js src/app.test.js README.md && git commit -m "feat: wire job monitoring into application"`

## Self-Review Checklist

- [ ] All spec requirements map to Tasks 1-6.
- [ ] No task stores credentials or raw API responses.
- [ ] Every production change has a failing test before implementation.
- [ ] Every task has an independently runnable test command.
- [ ] The dashboard exposes only documented routes.
- [ ] Existing job entrypoints remain compatible.
