const tracking = require('./vessel-tracking')
const lancar = (monitor) => require('./lancar-berkat-prima-gps').start(undefined, { monitor })
const stock = require('./stock-broadcast')
const ports = require('./port-generator')
const monitor = () => require('../monitor/server').startServer()

tracking.jobName = 'vessel-api-tracking'
lancar.jobName = 'lancar-berkat-prima-gps'
stock.jobName = 'stock-broadcast'
ports.jobName = 'port-generator'

module.exports = { tracking, lancar, stock, ports, monitor }
