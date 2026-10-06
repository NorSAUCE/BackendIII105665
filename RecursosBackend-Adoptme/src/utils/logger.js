import winston from "winston";
const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const isProduction = false//process.env.NODE_ENV === 'production'

export const logger = winston.createLogger({
    level: 'debug',//process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    format: combine(
        errors({ stack: true }),
        timestamp(),
        json()
    ),
    //defaultMeta: { service: 'adopt-me' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error'})
    ]
})

if (!isProduction) {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            printf(({level, message, timestamp, stack})=>{
                return `${timestamp} ${level}: ${stack || message}`
            })
        )
    }))
}

export const loggerTest = () => {
    logger.http("HTTP")
    logger.debug("DEBUG")
    logger.info("INFO")
    logger.warn("WARN")
    logger.error("ERROR")
}

export default { logger, loggerTest };