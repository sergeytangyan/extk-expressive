import type { NextFunction, Request, Response } from 'express';
import { isProd } from './env';
import { ApiError, BadRequestError, InternalError, UserUnauthorizedError } from './errors';
import { ApiErrorResponse } from './response/ApiErrorResponse';
import type { Container } from './types/common';


export const buildMiddleware = (container: Container) => {
    const { logger, alertHandler } = container;

    return {
        getGlobalNotFoundMiddleware: (content?: string) => {
            return (_req: Request, res: Response, _next: NextFunction) => {
                res.status(404).send(content ?? '¯\\_(ツ)_/¯').end();
            };
        },

        getApiNotFoundMiddleware: () => {
            return (req: Request, res: Response, _next: NextFunction) => {
                res
                    .status(404)
                    .json(new ApiErrorResponse(`${req.method} ${req.path} not found`, 'NOT_FOUND'))
                    .end();
            };
        },

        getApiErrorHandlerMiddleware: (errorMapper?: (err: Error & Record<string, unknown>) => ApiError | null | undefined) => {
            return async (err: Error & Record<string, unknown>, req: Request, res: Response, _next: NextFunction) => {
                let finalError: ApiError;

                const customMappedError = errorMapper && errorMapper(err);

                if (customMappedError) {
                    // like ZodError or MulterError
                    finalError = customMappedError;
                    logger.error('%s\n%o', finalError.message, finalError.data);
                } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
                    // bad json in request body
                    logger.error('%s', err);
                    finalError = new BadRequestError('Invalid json format');

                } else if (err instanceof ApiError) {
                    // checked api errors
                    // logger.error('%o', err);
                    logger.error('%s', err);
                    finalError = err;
                } else {
                    // unchecked errors
                    logger.error('Error: %s', err);
                    if (err.cause) {
                        logger.error('Cause: %s', err.cause);
                    }

                    if (alertHandler) {
                        alertHandler(err);
                    }

                    finalError = new InternalError();
                    if (!isProd()) {
                        finalError.data = { name: err.name, message: err.message, stack: err.stack, cause: err.cause };
                    }
                }

                res.status(finalError.httpStatusCode).json(new ApiErrorResponse(finalError.message, finalError.code, finalError.data));
            };
        },

        getGlobalErrorHandlerMiddleware: () => {
            return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
                logger.error(err);

                if (err instanceof ApiError) {
                    res.status(err.httpStatusCode).send(err.message);
                } else {
                    res.status(500).send('Something went wrong');
                }
            };
        },

        getBasicAuthMiddleware: (basicAuthBase64: string, basicRealm?: string) => {
            return (req: Request, res: Response, next: NextFunction) => {
                try {
                    const token = req.header('authorization');
                    if (!token || token.indexOf('Basic ') === -1) {
                        throw new UserUnauthorizedError('Missing Authorization Header');
                    }

                    const credentials = token.split(' ')[1];

                    if (basicAuthBase64 !== credentials) {
                        throw new UserUnauthorizedError('Invalid Authentication Credentials');
                    }

                    next();
                } catch (error) {
                    if (basicRealm) {
                        res.set('WWW-Authenticate', `Basic realm="${basicRealm}"`);
                    }

                    if (error instanceof ApiError) {
                        return next(error);
                    }

                    // catch all unknown errors
                    logger.error(error);
                    return next(new UserUnauthorizedError());
                }
            };
        },
    };
};
