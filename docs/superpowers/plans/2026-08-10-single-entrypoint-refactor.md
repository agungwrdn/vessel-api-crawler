# Single Entrypoint Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide one clean command for running the project while separating orchestration from the existing jobs.

**Architecture:** `src/app.js` is the single CLI entrypoint. Existing jobs are exposed through small adapters so their current behavior remains intact. Package scripts select the default job or an explicit job mode.

**Tech Stack:** Node.js, CommonJS, npm, Axios, Prisma, existing project dependencies.

## Global Constraints

- Do not send external API requests during validation.
- Preserve the existing legacy scripts for compatibility.
- Do not commit or expose existing credentials; move new configuration to environment variables where touched.

### Task 1: Add the single entrypoint and job adapters

**Files:**
- Create: `src/app.js`
- Create: `src/jobs/index.js`
- Create: `src/jobs/vessel-tracking.js`
- Create: `src/jobs/stock-broadcast.js`
- Create: `src/jobs/port-generator.js`

- [ ] Add adapters that load the legacy modules only when selected.
- [ ] Add CLI dispatch for `tracking`, `stock`, `ports`, and `all`.
- [ ] Ensure unknown modes return a non-zero exit code.

### Task 2: Update npm commands and documentation

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `README.md`

- [ ] Make `npm start` invoke the single entrypoint.
- [ ] Add explicit per-job commands and `npm run build`.
- [ ] Document the command examples and environment configuration.

### Task 3: Validate the refactor

**Files:**
- Test: `src/app.js` through syntax and dry-run commands.

- [ ] Run `node --check` for all source files.
- [ ] Run the CLI help and invalid-mode checks.
- [ ] Inspect the final diff for accidental secrets or unrelated changes.
