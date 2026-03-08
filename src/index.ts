import type { Container } from './types/common';

import { buildExpressive } from './expressive';
import { buildMiddleware } from './middleware';


export type * from './types/common';
export type * from './types/expressive';
export type * from './types/swagger';

export * from './common';
export * from './env';
export { SWG } from './swagger';
export type { SwaggerBuilder } from './swagger';

export * from './errors';
export * from './response/ApiErrorResponse';
export * from './response/ApiResponse';


export function bootstrap(container: Container) {
    return {
        ...buildExpressive(container),
        ...buildMiddleware(container),

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
