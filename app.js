/**
 * @author David Alexis <david.jacome@detektor.com.hn>
*/
import dotenv from 'dotenv'
import express from 'express'
import { logger, loggerCon } from './app/utils/logger.js'
import { conexionDBPGP } from './app/db/dbConfig.js'
import { conexionRedis } from './app/config/redisConfig.js'
dotenv.config()

const server = express()
const port = process.env.PORT || 3000
const name = process.env.APP || 'Planner'
let sco

// ✅ Crea el cliente Postgres
const clientDBPGB = await conexionDBPGP()

// ✅ Crea el cliente Redis
const client = await conexionRedis()

// ✅ Se conecta a Redis
await client.connect().then(() => {
    // ✅ Inicia el servidor
    server.listen(port, () => {
        logger.info(`😀 ${name} running on port: ${port}.`)
        loggerCon.info(`😀 ${name} running on port: ${port}.`)
    })
})

// ✅ Se conecta a PGP
clientDBPGB.connect({direct: true}).then(async obj => {
    sco = obj
    // ✅ Revisa si las tablas ya estan en memoria
    const exist = await client.exists(process.env.TABLAS)
    if(exist === 1) {
        logger.info('Las tablas flotas estan en memoria.')
        loggerCon.info('Las tablas flotas estan en memoria.')
    } else {
        sco.tx(t => {
                return t.any(`SELECT * FROM ruta order by id_r desc`,
            ).then(async rutas => {
                for await (const ruta of rutas) {
                    client.hSet(`CDs_${ruta.usuario}`, ruta.nombre, JSON.stringify(ruta))
                }
                logger.info('Guardado de rutas en memoria finalizado.')
                loggerCon.info('Guardado de rutas en memoria finalizado.')

                return t.any(`SELECT * FROM rz_evento_cp where fecha_u > $1`, [ '2024-01-01' ])
            }).then(async eventos => {
                for await (const evento of eventos) {
                    client.hSet(`rz_evento_${evento.cp}`, `idr_${evento.id_r}_idEvt_${evento.idevento}`, JSON.stringify(evento))
                }
                logger.info('Guardado de rz_eventos en memoria finalizado.')
                loggerCon.info('Guardado de rz_eventos en memoria finalizado.')

                return t.any(`select * from evento`)
            }).then(async motivos => {
                for await (const motivo of motivos) {
                    client.hSet(`evento_flotas`, motivo.idevento, JSON.stringify(motivo))
                }
                logger.info('Guardado de motivos en memoria finalizado.')
                loggerCon.info('Guardado de motivos en memoria finalizado.')

                return true
            })
        }).then(res => {
            client.hSet(process.env.TABLAS, 'flotas', 'true')
            logger.info('Proceso de tablas flotas en memoria finalizado.')
            loggerCon.info('Proceso de tablas flotas en memoria finalizado.')
        }).catch(err => {
            logger.error(`${err.message} with code: ${err.code}`)
            loggerCon.error(`${err.message} with code: ${err.code}`)
        }).finally(() => {
            // clientDBPGB.$pool.end()
        })
    }

    // ✅ Recibe las notificaciones de Postgres
    sco.client.on('notification', async msg => {
        logger.info(`Received: ${msg.payload}`)
        loggerCon.info(`Received: ${msg.payload}`)
        const payload = JSON.parse(msg.payload)
        const record = payload.record

        // ✅ Verifica que tabla ha enviado la notificación
        switch (payload.identity) {
            case 'ruta_test':
                switch (payload.action) {
                    case 'insert':
                    case 'update':
                        const resultUpsert = await client.hSet(`CDs_${record.usuario}`, record.nombre, JSON.stringify(record))
                        logger.info(`HSET Result: ${resultUpsert == 0 ? 'Update' : 'Create'} Key: CDs_${record.usuario} Field: ${record.nombre}`)
                        loggerCon.info(`HSET Result: ${resultUpsert == 0 ? 'Update' : 'Create'} Key: CDs_${record.usuario} Field: ${record.nombre}`)
                        break
                    case 'delete':
                        const resultDel = await client.hDel(`CDs_${record.usuario}`, record.nombre)
                        logger.info(`HSET Result: ${resultDel > 0 ? 'Delete' : 'No exist'} Key: CDs_${record.usuario} Field: ${record.nombre}`)
                        loggerCon.info(`HSET Result: ${resultDel > 0 ? 'Delete' : 'No exist'} Key: CDs_${record.usuario} Field: ${record.nombre}`)
                        break
                    default:
                        logger.warn(`Unknown action.`)
                        loggerCon.warn(`Unknown action.`)
                        break
                }
                break
            case 'rz_evento_cp_test':
                switch (payload.action) {
                    case 'insert':
                    case 'update':
                        const resultUpsert = await client.hSet(`rz_evento_${record.cp}`, `idr_${record.id_r}_idEvt_${record.idevento}`, JSON.stringify(record))
                        logger.info(`HSET Result: ${resultUpsert == 0 ? 'Update' : 'Create'} Key: rz_evento_${record.cp} Field: ${`idr_${record.id_r}_idEvt_${record.idevento}`}`)
                        loggerCon.info(`HSET Result: ${resultUpsert == 0 ? 'Update' : 'Create'} Key: rz_evento_${record.cp} Field: ${`idr_${record.id_r}_idEvt_${record.idevento}`}`)
                        break
                    case 'delete':
                        const resultDel = await client.hDel(`rz_evento_${record.cp}`, `idr_${record.id_r}_idEvt_${record.idevento}`)
                        logger.info(`HSET Result: ${resultDel > 0 ? 'Delete' : 'No exist'} Key: rz_evento_${record.cp} Field: ${`idr_${record.id_r}_idEvt_${record.idevento}`}`)
                        loggerCon.info(`HSET Result: ${resultDel > 0 ? 'Delete' : 'No exist'} Key: rz_evento_${record.cp} Field: ${`idr_${record.id_r}_idEvt_${record.idevento}`}`)
                        break
                    default:
                        logger.warn(`Unknown action.`)
                        loggerCon.warn(`Unknown action.`)
                        break
                }
                break
            case 'evento_test':
                switch (payload.action) {
                    case 'insert':
                    case 'update':
                        const resultUpsert = await client.hSet(`evento_flotas`, record.idevento, JSON.stringify(record))
                        logger.info(`HSET Result: ${resultUpsert == 0 ? 'Update' : 'Create'} Key: evento_flotas Field: ${record.idevento}`)
                        loggerCon.info(`HSET Result: ${resultUpsert == 0 ? 'Update' : 'Create'} Key: evento_flotas Field: ${record.idevento}`)
                        break
                    case 'delete':
                        const resultDel = await client.hDel(`evento_flotas`, record.idevento)
                        logger.info(`HSET Result: ${resultDel > 0 ? 'Delete' : 'No exist'} Key: evento_flotas Field: ${record.idevento}`)
                        loggerCon.info(`HSET Result: ${resultDel > 0 ? 'Delete' : 'No exist'} Key: evento_flotas Field: ${record.idevento}`)
                        break
                    default:
                        logger.warn(`Unknown action.`)
                        loggerCon.warn(`Unknown action.`)
                        break
                }
                break
            default:
                logger.warn(`Unknown identity to process.`)
                loggerCon.warn(`Unknown identity to process.`)
                break
        }
    })
    return sco.none('LISTEN $1:name', process.env.NOTIFY_CH)
}).catch(err => {
    logger.error(`${err.message} with code: ${err.code}`)
    loggerCon.error(`${err.message} with code: ${err.code}`)
})

// ✅ Manejando señales
function signalHandler(signal) {
    logger.warn(`Receive signal: ${signal}, Server Close`)
    loggerCon.warn(`Receive signal: ${signal}, Server Close`)
    client.quit()
    if (sco) {
        sco.done()
    }
    process.exit(0)
}

process.on('SIGINT', signalHandler)
process.on('SIGTERM', signalHandler)
process.on('SIGQUIT', signalHandler)
process.on('SIGBREAK', signalHandler)