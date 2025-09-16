import type { NextFunction, Request, Response } from 'express';
import { isProd } from '../env';
import { ApiError, BadRequestError, InternalError } from '../errors';
import { ApiErrorResponse } from '../response/ApiErrorResponse';
import type { Container } from '../types/common';
import { createReqSnapshot } from '../common';


export const buildErrorHandlerMiddleware = (container: Container) => {
    const { logger, alertHandler } = container;

    return {
        getErrorHandlerMiddleware: (errorMapper?: (err: Error & Record<string, unknown>) => ApiError | null | undefined) => {
            return async (err: Error & Record<string, any>, req: Request, res: Response, _next: NextFunction) => {
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
                        alertHandler(err, createReqSnapshot(req));
                    }

                    finalError = new InternalError();
                    if (!isProd()) {
                        finalError.data = { name: err.name, message: err.message, stack: err.stack, cause: err.cause };
                    }
                }

                res.status(finalError.httpStatusCode).json(new ApiErrorResponse(finalError.message, finalError.code, finalError.data));
            };
        },
    };
};
