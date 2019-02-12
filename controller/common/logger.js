let winston = require('winston');
var logger = winston.createLogger({
  level: 'info',
  levels: {
    error: 0,
    info: 1,
    trace: 2,
    data: 3,
    debug: 4,
    input: 5,
    prompt: 6,
    help: 7,
    warn: 8,
    verbose: 9
  },
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
module.exports = logger;