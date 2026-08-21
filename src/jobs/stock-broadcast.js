module.exports = (monitor) => {
  const run = (context) => require('../../index').broadcastStokReport({ monitor: context })
  return monitor ? monitor.run(run) : require('../../index').broadcastStokReport()
}
