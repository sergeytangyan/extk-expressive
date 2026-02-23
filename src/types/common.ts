/* eslint-disable @typescript-eslint/no-explicit-any */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace';
export type OtherString = string & {};
export type OtherUnknown = unknown & {};
export type ContentType = 'application/json' | 'application/xml' | 'text/plain' | 'text/html' | OtherString;

export type AlertHandler = (err: Error & Record<string, any>, context?: string) => void | Promise<void>;

export type Logger = {
    info(message: string, ...args: any[]): void;
    error(message: string | Error | unknown, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
};

export type Container = {
    logger: Logger,
    alertHandler?: AlertHandler,
};
