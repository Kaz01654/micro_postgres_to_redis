import redis from 'redis'
import { logger, loggerCon } from '../utils/logger.js'

// ✅ Realiza la conexión a Redis
export async function conexionRedis() {
    try {
        const host = await process.env.REDIS_SKT_HOST_MASTER
        const port = await process.env.REDIS_SKT_PORT
        const pass = await process.env.REDIS_SKT_PASS

        const redisClient = await redis.createClient({
            socket: {
                host: host,
                port: port
            },
            password: pass,
            detect_buffers: true
        })
        .on('connect', () => logger.info(`Redis connected to ${host}:${port}`), loggerCon.info(`Redis connected to ${host}:${port}`))
        .on('ready', () => logger.info(`Redis is ready in ${host}:${port}`), loggerCon.info(`Redis is ready in ${host}:${port}`))
        .on('reconnecting', () => logger.info(`Redis is reconnecting to ${host}:${port}`), loggerCon.info(`Redis is reconnecting to ${host}:${port}`))
        .on('end', () => logger.info(`Redis end connection to ${host}:${port}`), loggerCon.info(`Redis end connection to ${host}:${port}`))
        .on('error', (err) => loggerCon.error(`Error connecting to ${host}:${port}`, err))

        return redisClient
    } catch (err) {
        logger.error(`Ocurrio un error, codigo : ${err.statusCode} y mensaje: ${err.message}`)
        loggerCon.error(`Ocurrio un error, codigo : ${err.statusCode} y mensaje: ${err.message}`)
    }
}