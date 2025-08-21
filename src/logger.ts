import type { Logger } from 'winston';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './config';


// -------------------------------------------------------------------------- //
const loggerRegistry: Record<string | symbol, Logger> = {};

const defaultFormat = winston.format.combine(
    winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
    winston.format.splat(), // String interpolation splat for %d %s-style messages.
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => `${timestamp}[${level.toUpperCase()}]: ${stack || message}`),
);

const consoleTransport = new winston.transports.Console({
    handleExceptions: true,
});

const createFileLogger = (filename: string) => {
    const logger = winston.createLogger({
        format: defaultFormat,
        transports: [
            new DailyRotateFile({
                level: 'debug',
                filename: `./logs/${filename}-%DATE%.log`,
                handleExceptions: true,
                // exitOnError: false, // do not exit on handled exceptions
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                auditFile: './logs/audit.json',
                maxSize: '20m',
                maxFiles: config.env === 'prod' ? '30d' : '1d',
                // format: defaultFormat,
                // the nested 'format' field causes issues with logging errors;
                // use the 'format' field on logger, instead of transport;
            }),
        ],
    });

    if (config.env === 'dev') {
        logger.add(consoleTransport);
    }

    return logger;
};

// -------------------------------------------------------------------------- //
export const createLogger = winston.createLogger;

export const getDefaultFileLogger = (name: string) => {
    if (!loggerRegistry[name]) {
        loggerRegistry[name] = createFileLogger(name);
    }

    return loggerRegistry[name];
};

const defaultConsoleLoggerKey = Symbol('console');
export const getDefaultConsoleLogger = () => {
    if (!loggerRegistry[defaultConsoleLoggerKey]) {
        loggerRegistry[defaultConsoleLoggerKey] = winston.createLogger({
            format: defaultFormat,
            transports: [
                consoleTransport,
            ],
        });
    }

    return loggerRegistry[defaultConsoleLoggerKey]
};
