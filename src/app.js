const jobs = require('./jobs');
const { createMonitorStore } = require('./monitor/store')
const { createMonitor } = require('./monitor')

const usage = `Usage: node src/app.js <job>

Jobs:
  tracking  Collect vessel GPS data
  lancar    Collect KM. Lancar Berkat Prima last GPS position
  stock     Broadcast stock report
  ports     Generate port data
  monitor   Start the local job monitoring dashboard
  all       Start all jobs (default)
`;

function resolveJob(argument) {
  const job = argument || 'all';
  if (job === 'all') return [jobs.tracking, jobs.lancar, jobs.ports];
  if (jobs[job]) return [jobs[job]];
  return null;
}

function main(argument = process.argv[2]) {
  const selectedJobs = resolveJob(argument);
  if (!selectedJobs) {
    console.error(`Unknown job: ${argument}\n\n${usage}`);
    return 1;
  }

  if (argument === 'monitor') {
    selectedJobs.forEach((job) => job())
    return 0
  }

  const monitorStore = process.env.MONITOR_DISABLED === 'true' ? null : createMonitorStore()
  selectedJobs.forEach((job) => {
    const monitor = monitorStore && job.jobName ? createMonitor(job.jobName, monitorStore) : undefined
    job(monitor)
  });
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main, resolveJob, usage };
