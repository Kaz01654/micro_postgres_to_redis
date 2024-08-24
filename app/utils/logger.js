import 'winston-daily-rotate-file'
import { addColors, transports as _transports, createLogger } from 'winston'
import { format } from 'winston'

const { combine, timestamp, json, prettyPrint, colorize } = format

addColors({
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  http: 'green',
  sql: 'black',
  debug: 'gray'
})

const errorTransport = new _transports.DailyRotateFile({
  level: process.env.LOG_LEVEL_ERROR,
  filename: 'app/logs/error/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: process.env.LOG_MAX_SIZE,
  maxFiles: process.env.LOG_MAX_FILES
})

const warnTransport = new _transports.DailyRotateFile({
  level: process.env.LOG_LEVEL_WARNING,
  filename: 'app/logs/warning/warn-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: process.env.LOG_MAX_SIZE,
  maxFiles: process.env.LOG_MAX_FILES
})

const infoTransport = new _transports.DailyRotateFile({
  level: process.env.LOG_LEVEL_INFO,
  filename: 'app/logs/information/info-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: process.env.LOG_MAX_SIZE,
  maxFiles: process.env.LOG_MAX_FILES
})

infoTransport.on('rotate',(oldFilename, newFilename) => {
  logger.info('New info file created: ' + newFilename)
})

infoTransport.on('logRemoved',(removedFilename) => {
  logger.info('Info file removed: ' + removedFilename)
})

warnTransport.on('rotate',(oldFilename, newFilename) => {
  logger.info('New warning file created: ' + newFilename)
})

warnTransport.on('logRemoved',(removedFilename) => {
  logger.info('Warning file removed: ' + removedFilename)
})

errorTransport.on('rotate',(oldFilename, newFilename) => {
  logger.info('New error file created: ' + newFilename)
})

errorTransport.on('logRemoved',(removedFilename) => {
  logger.info('Error file removed: ' + removedFilename)
})

export const logger = createLogger({
  level: process.env.LOG_LEVEL_DEBUG,
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    json(),
    prettyPrint()
  ),
  transports: [
    infoTransport,
    warnTransport,
    errorTransport
  ]
})

export const loggerCon = createLogger({
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    json(),
    prettyPrint(),
    colorize({ all: true })
  ),
  transports: [new _transports.Console({
    colorize: true
  })]
})