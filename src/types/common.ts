import type {  Request, Response } from 'express';


export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace';
export type OtherString = string & {};
export type ContentType = 'application/json' | 'application/xml' | 'text/plain' | 'text/html' | OtherString;

export type AlertHandler = (err: Error & Record<string, any>, req: Request, res: Response) => void | Promise<void>;
