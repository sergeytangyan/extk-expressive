import { buildExpressive } from './expressive';
import { buildErrorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import { notFoundMiddleware } from './middleware/notFoundMiddleware';
import { buildSwaggerBuilder } from './swagger';
import type { Container } from './types/common';
import type { ReqSnapshot } from './types/expressive';
import type { SwaggerConfig } from './types/swagger';

export * from './common';
export * from './env';
export * from './logger';
export { SWG } from './swagger';

export type * from './types/common';
export type * from './types/expressive';
export type * from './types/swagger';

export * from './errors';
export * from './response/ApiErrorResponse';
export * from './response/ApiResponse';


export function bootstrap(container: Container) {
    const swaggerDoc: SwaggerConfig = {
        openapi: '3.1.0', // TODO
        info: {},
        paths: {},
        components: {},
    };

    return {
        ...buildExpressive(container, swaggerDoc),
        ...buildSwaggerBuilder(swaggerDoc),
        ...buildErrorHandlerMiddleware(container),
        notFoundMiddleware,

        silently: (fn: () => Promise<void>, reqSnapshot?: ReqSnapshot) => {
            fn().catch((e: unknown) => {
                if (container.alertHandler && e instanceof Error) {
                    container.alertHandler(e, reqSnapshot);
                } else {
                    container.logger.error(e);
                }
            });
        },
    };
}
