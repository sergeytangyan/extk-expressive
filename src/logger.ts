import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { isDev, isProd } from './env';
import type { Logger } from './types/common';


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
                maxFiles: isProd() ? '30d' : '1d',
                // format: defaultFormat,
                // the nested 'format' field causes issues with logging errors;
                // use the 'format' field on logger, instead of transport;
            }),
        ],
    });

    if (isDev()) {
        logger.add(consoleTransport);
    }

    return logger;
};

// -------------------------------------------------------------------------- //
export const createLogger = winston.createLogger;

export const getDefaultFileLogger = (name: string | symbol = Symbol('app')) => {
    if (!loggerRegistry[name]) {
        loggerRegistry[name] = createFileLogger(name.toString());
    }

    return loggerRegistry[name];
};

export const getDefaultConsoleLogger = (name: string | symbol = Symbol('console')) => {
    if (!loggerRegistry[name]) {
        loggerRegistry[name] = winston.createLogger({
            format: defaultFormat,
            transports: [
                consoleTransport,
            ],
        });
    }

    return loggerRegistry[name];
};
