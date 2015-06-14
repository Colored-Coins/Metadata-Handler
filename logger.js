var winston = require('winston')
var fs = require('fs')

var dir = (__dirname + '/log')

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

var custom_time_stamp1 = function () {
  var date = new Date()
  var month = date.getUTCMonth() + 1
  return date.getUTCDate() + '/' + month + '/' + date.getFullYear() + '-' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds()
}

var custom_time_stamp2 = function () {
  var date = new Date()
  var month = date.getUTCMonth() + 1
  return date.getUTCDate() + '/' + month + '/' + date.getFullYear() + '-' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds() + ':' + date.getUTCMilliseconds()
}

var development_transports = function () {
  var temp =
  [
    new (winston.transports.Console)({
      level: 'debug',
      colorize: true,
      silent: false,
      timestamp: custom_time_stamp1
    }),
    new (winston.transports.DailyRotateFile)({
      level: 'silly',
      filename: __dirname + '/log/log.txt',
      maxsize: 500000,
      prettyPrint: true,
      silent: false,
      timestamp: custom_time_stamp2
    })
  ]
  return temp
}

var qa_transports = function () {
  var temp =
  [
    new (winston.transports.Console)({
      level: 'silly',
      colorize: true,
      silent: false,
      timestamp: custom_time_stamp1
    }),
    new (winston.transports.DailyRotateFile)({
      level: 'silly',
      filename: __dirname + '/log/log.txt',
      maxsize: 500000,
      prettyPrint: true,
      silent: false,
      timestamp: custom_time_stamp2
    })
  ]
  return temp
}

var production_transports = function () {
  var temp =
  [
    new (winston.transports.Console)({
      level: 'info',
      colorize: true,
      silent: false,
      timestamp: custom_time_stamp1
    }),
    new (winston.transports.DailyRotateFile)({
      level: 'info',
      filename: __dirname + '/log/log.txt',
      maxsize: 500000,
      prettyPrint: true,
      silent: false,
      timestamp: custom_time_stamp2
    })
  ]
  return temp
}

var defaultTransports = function () {
  var temp =
  [
    new (winston.transports.Console)({
      level: 'silly',
      colorize: true,
      silent: false,
      timestamp: custom_time_stamp1
    })
  ]
  return temp
}

module.exports = function (env, transports, cli) {
  var logger

  if (transports) {
    logger = new (winston.Logger)(transports)
  } else {
    switch (env) {
      case 'development':
        logger = new (winston.Logger)({transports: development_transports()})
        break
      case 'QA':
        logger = new (winston.Logger)({transports: qa_transports()})
        break
      case 'production':
        logger = new (winston.Logger)({transports: production_transports()})
        break
      default:
        logger = new (winston.Logger)({transports: defaultTransports()})
        break
    }
  }
  if (cli) logger.cli()

  return logger
}
