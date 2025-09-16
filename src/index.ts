import { buildExpressive } from './expressive';
import { buildErrorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import { notFoundMiddleware } from './middleware/notFoundMiddleware';
import type { Container } from './types/common';
import type { ReqSnapshot } from './types/expressive';
import type { SwaggerConfig } from './types/swagger';

export * from './env';
export * from './common';
export * from './logger';
export { SWG, swaggerBuilder } from './swagger';

export type * from './types/common';
export type * from './types/expressive';
export type * from './types/swagger';

export * from './errors';
export * from './response/ApiErrorResponse';
export * from './response/ApiResponse';


export function bootstrap(container: Container, swaggerDoc: SwaggerConfig) {
    return {
        ...buildExpressive(container, swaggerDoc),

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
