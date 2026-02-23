import type { Container } from './types/common';
import type { SwaggerConfig } from './types/swagger';

import { buildExpressive } from './expressive';
import { buildMiddleware } from './middleware';
import { SwaggerBuilder } from './swagger';

export type * from './types/common';
export type * from './types/expressive';
export type * from './types/swagger';

export * from './common';
export * from './env';
export { SWG } from './swagger';

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
        ...buildMiddleware(container),

        swaggerBuilder: () => new SwaggerBuilder(swaggerDoc),

        silently: async (fn: () => Promise<void> | void) => {
            try {
                await fn();
            } catch (e: unknown) {
                if (container.alertHandler && e instanceof Error) {
                    container.alertHandler(e);
                } else {
                    container.logger.error(e);
                }
            }
        },
    };
}
