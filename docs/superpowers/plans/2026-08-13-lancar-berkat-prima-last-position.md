# KM. Lancar Berkat Prima Last-Position GPS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scheduled, testable crawler job for the partner API's KM. Lancar Berkat Prima last-position endpoint.

**Architecture:** Keep the existing VesselAPI job unchanged. Add a focused partner job with injectable HTTP and database clients, normalize the partner response, persist to the existing `device_gps` and `device_gpsHits` models, and register it in the shared CLI entrypoint.

**Tech Stack:** Node.js, Axios, dotenv, Prisma Client, Node test runner.

## Global Constraints

- Partner endpoint is `GET https://shipmanagement-iksn.com/api/partner/v1/gps/getlastposition`.
- Authentication uses the `X-API-Key` header.
- Default ESN is `4585161` and default interval is six hours.
- API keys must come from environment variables and must not be committed or logged.
- Only last-position retrieval is in scope; history/pagination is out of scope.

---

### Task 1: Add partner GPS job and tests

**Files:**
- Create: `src/jobs/lancar-berkat-prima-gps.js`
- Create: `src/jobs/lancar-berkat-prima-gps.test.js`

**Interfaces:**
- Produces `normalizePosition`, `fetchPosition`, `savePosition`, `runOnce`, and `start`.
- `fetchPosition({ apiKey, http })` returns `{ esn, name, latitude, longitude, speed, heading, timestamp }`.
- `runOnce({ apiKey, http, client })` returns an array of successfully saved positions.

- [ ] **Step 1: Write tests for normalization, request, persistence, and one-shot execution.**
- [ ] **Step 2: Run `node --test src/jobs/lancar-berkat-prima-gps.test.js` and verify the new tests fail before implementation.**
- [ ] **Step 3: Implement environment defaults, strict response validation, `X-API-Key` request, and existing Prisma writes.**
- [ ] **Step 4: Run the focused test and verify it passes.**

### Task 2: Register command and environment templates

**Files:**
- Modify: `src/jobs/index.js`
- Modify: `src/app.js`
- Modify: `README.md`
- Create: `.env.example`
- Create: `.env`

**Interfaces:**
- `node src/app.js lancar` starts the partner job.
- `node src/app.js all` starts tracking, partner GPS, and ports.

- [ ] **Step 1: Register the `lancar` job and update CLI usage.**
- [ ] **Step 2: Add the partner variables to `.env.example` and a local empty-key `.env`.**
- [ ] **Step 3: Document setup and commands without exposing credentials.**
- [ ] **Step 4: Run `npm test` and verify the full suite passes.**

### Task 3: Final verification

**Files:**
- Verify: all changed files and Git status.

- [ ] **Step 1: Run `node --check` on the new and modified JavaScript files.**
- [ ] **Step 2: Run `npm test`.**
- [ ] **Step 3: Confirm `.env` is ignored and no API key is present in tracked files.**
- [ ] **Step 4: Report implementation and live API limitation separately.**
