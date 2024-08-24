import PG from 'pg'
import pgPromise from 'pg-promise'
import { logger, loggerCon } from '../utils/logger.js'

const initOptions = {
  connect(e) {
    const cp = e.client.connectionParameters
    logger.info(`PGP Client connected to host ${cp.host} in database ${cp.database} as user ${cp.user} at port ${cp.port}.`)
    loggerCon.info(`PGP Client connected to host ${cp.host} in database ${cp.database} as user ${cp.user} at port ${cp.port}.`)
  },
  disconnect(e) {
    const cp = e.client.connectionParameters
    logger.info(`PGP Client disconnecting from host ${cp.host} in database ${cp.database} as user ${cp.user} at port ${cp.port}.`)
  },
  query(e) {
    logger.info(`QUERY: ${e.query}`)
  },
  task(e) {
    if (e.ctx.finish) {
      logger.info(`Query Duration: ${e.ctx.duration} ms`)
      if (e.ctx.success) {
        logger.info(`Task success`)
      } else {
        logger.info(`Task fail`)
      }
    } else {
      logger.info(`Start Time: ${e.ctx.start}`)
    }
  },
  transact(e) {
    if (e.ctx.finish) {
      logger.info(`Query Duration: ${e.ctx.duration} ms`)
      if (e.ctx.success) {
        logger.info(`Transaction success`)
      } else {
        logger.info(`Transaction fail`)
      }
    } else {
      logger.info(`Start Time: ${e.ctx.start}`)
    }
  },
  error(err, e) {
    if (e.cn) {
      logger.error(`Error connecting to host ${e.host} in database ${e.database} as user ${e.user} at port ${e.port}.`, err)
    }

    if (e.query) {
      if (e.params) {
        logger.error(`Query error:`, e.params)
      }
    }

    if (e.ctx) {
      logger.error(`ctx error:`, e.ctx)
    }
  }
}

const pgp = pgPromise(initOptions)

// ✅ Realiza la conexión a la BD
export async function conexionDB() {
  try {
    const host = process.env.DB_SKT_HOST
    const database = process.env.DB_SKT_BASEGPS
    const user = process.env.DB_SKT_USER
    const port = process.env.DB_SKT_PORT
    const pass = process.env.DB_SKT_PASS
    const max_con = process.env.DB_MAX_CON
    const min_con = process.env.DB_MIN_CON
    const acq = process.env.DB_ACQ
    const idle = process.env.DB_IDLE

    const pool = new PG.Pool({
      user: user,
      host: host,
      database: database,
      password: pass,
      port: port,
      pool: {
        max: max_con,
        min: min_con,
        acquire: acq,
        idle: idle
      }
    })
    .on('connect', () => logger.info(`PG Client connected to host ${host} in database ${database} as user ${user} at port ${port}.`), loggerCon.info(`PG Client connected to host ${host} in database ${database} as user ${user} at port ${port}.`))
    .on('release', () => logger.info(`PG Client release from host ${host} in database ${database} as user ${user} at port ${port}.`))
    .on('remove', () => logger.info(`PG Client remove from host ${host} in database ${database} as user ${user} at port ${port}.`))
    .on('acquire', () => logger.info(`PG Client acquire from host ${host} in database ${database} as user ${user} at port ${port}.`))
    .on('error', (err) => logger.error(`Error connecting to host ${host} in database ${database} as user ${user} at port ${port}.`, err))

    return pool
  } catch (err) {
    logger.error(`Ocurrio un error, ${err.message}`)
    loggerCon.error(`Ocurrio un error, ${err.message}`)
  }
}

// ✅ Realiza la conexión a la BD
export async function conexionDBPGP() {
  try {
    const host = process.env.DB_SKT_HOST
    const database = process.env.DB_SKT_BASEGPS
    const user = process.env.DB_SKT_USER
    const port = process.env.DB_SKT_PORT
    const pass = process.env.DB_SKT_PASS
    const max_con = process.env.DB_MAX_CON
    const min_con = process.env.DB_MIN_CON
    const acq = process.env.DB_ACQ
    const idle = process.env.DB_IDLE

    const db = pgp({
      user: user,
      host: host,
      database: database,
      password: pass,
      port: port,
      pool: {
        max: max_con,
        min: min_con,
        acquire: acq,
        idle: idle
      }
    })

    return db
  } catch (err) {
    logger.error(`Ocurrio un error, ${err.message}`)
    loggerCon.error(`Ocurrio un error, ${err.message}`)
  }
}