import winston from 'winston'
import chalk from 'chalk'

/**
 * Adapter for logger
 */
class Logger {
  /**
   * Constructor to logger
   */
  constructor () {
    const errorStackFormat = winston.format((err) => {
      if (err.level === 'error') {
        return Object.assign({}, err, {
          stack: err.stack,
          message: err.message
        })
      }
      return err
    })

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            errorStackFormat(),
            winston.format.colorize(),
            winston.format.json(),
            winston.format.printf(
              (info) => `${info.timestamp} ${info.level}: ${info.message}`
            ),
            winston.format.simple()
          ),
          level: 'info', // Local Dev to preview all logging events
          handleExceptions: true // Show exceptions in the console
        })
      ]
    })
  }

  /**
   * Logs via Trace
   * @param  {...any} args any args
   */
  trace (...args) {
    this.logger.trace(...args)
  }

  /**
   * Logs via Trace
   * @param  {...any} args any args
   */
  debug (...args) {
    this.logger.debug(...args)
  }

  /**
   * Logs via Info
   * @param  {...any} args any args
   */
  info (...args) {
    this.logger.info(...args)
  }

  /**
   * Logs via Warn
   * @param  {...any} args any args
   */
  warn (...args) {
    this.logger.warn(...args)
  }

  /**
   * Logs via Error
   * @param  {...any} args any args
   */
  error (...args) {
    this.logger.error(...args)
  }

  expressMiddleware (req, res, next) {
    console.log(
      new Date().toLocaleString() + chalk.green(` ${req.method} - ${req.url} - ${JSON.stringify(req.body)} `)
    )
    next()
  }
}

export default new Logger()
