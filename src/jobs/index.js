module.exports = {
  tracking: require('./vessel-tracking'),
  lancar: () => require('./lancar-berkat-prima-gps').start(),
  stock: require('./stock-broadcast'),
  ports: require('./port-generator'),
};
