function createMonitor(jobName, store) {
  async function safe(callback) {
    try {
      return await callback()
    } catch {
      return undefined
    }
  }

  async function phase(context, phaseName, callback, details) {
    const phaseRecord = context && context.runId
      ? await safe(() => store.startPhase(context.runId, phaseName, details))
      : null

    try {
      const result = await callback()
      if (phaseRecord) await safe(() => store.finishPhase(phaseRecord.phaseId, 'success', { details }))
      return result
    } catch (error) {
      if (phaseRecord) {
        await safe(() => store.finishPhase(phaseRecord.phaseId, 'error', {
          message: error.message,
          errorMessage: error.message,
          details,
        }))
      }
      throw error
    }
  }

  async function run(callback, details) {
    const runRecord = await safe(() => store.startRun(jobName, details))
    const context = {
      runId: runRecord && runRecord.runId,
      phase: (phaseName, phaseCallback, phaseDetails) => phase(context, phaseName, phaseCallback, phaseDetails),
    }

    try {
      const result = await callback(context)
      if (runRecord) await safe(() => store.finishRun(runRecord.runId, 'success', { details }))
      return result
    } catch (error) {
      if (runRecord) {
        await safe(() => store.finishRun(runRecord.runId, 'error', {
          message: error.message,
          errorMessage: error.message,
          details,
        }))
      }
      throw error
    }
  }

  return { run, phase, safe }
}

module.exports = { createMonitor }
