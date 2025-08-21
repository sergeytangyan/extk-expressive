import type { NextFunction, Request, Response } from 'express';


export const notFoundMiddleware = (_req: Request, res: Response, _next: NextFunction) => {
    res.status(404).send('¯\\_(ツ)_/¯').end();
};
