/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Logger as WinstonLogger } from 'winston';
import type { ReqSnapshot } from './expressive';


export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace';
export type OtherString = string & {};
export type OtherUnknown = unknown & {};
export type ContentType = 'application/json' | 'application/xml' | 'text/plain' | 'text/html' | OtherString;

export type AlertHandler = (err: Error & Record<string, any>, reqSnapshot?: ReqSnapshot) => void | Promise<void>;
export type Logger = WinstonLogger;

export type Container = {
    logger: Logger,
    alertHandler?: AlertHandler,
};
