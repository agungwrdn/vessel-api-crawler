const jobs = require('./jobs');

const usage = `Usage: node src/app.js <job>

Jobs:
  tracking  Collect vessel GPS data
  lancar    Collect KM. Lancar Berkat Prima last GPS position
  stock     Broadcast stock report
  ports     Generate port data
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

  selectedJobs.forEach((job) => job());
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main, resolveJob, usage };
