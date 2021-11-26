/* global process */

import Logger from './classes/Logger'
import Server from './classes/Server'

/**
 * Define Application start
 * @returns {Promise<void>}
 */
const start = async () => {
  try {
    // Initialize the server
    await Server.init()
  } catch (err) {
    Logger.error(`Error inside app start: ${err.message}`)
    throw err
    // eslint-disable-next-line no-unreachable
    process.exit(1)
  }
}

// Start the server
start()
