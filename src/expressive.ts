import express from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import morgan from 'morgan';
import qs from 'qs';
import swaggerUi from 'swagger-ui-express';
import { container } from './container';
import { convertExpressPath, globalSwaggerDoc, tryParsePathParameters } from './swagger';
import type { HttpMethod } from './types/common';
import type { ExpressHandler, ExpressRoute } from './types/expressive';
import type { AuthMethod, Param, PathItem, Servers, SwaggerConfig } from './types/swagger';


// ----------------------------------------------- //
export function expressiveRouter(
    groupContext?: {
        swaggerDoc?: SwaggerConfig,
        oapi?: {
            tags?: string[],
            servers?: Servers,
            security?: AuthMethod[]
        },
    },
    router?: express.Router,
) {
    router ??= express.Router();
    const swaggerDoc = groupContext?.swaggerDoc ?? globalSwaggerDoc;

    return {
        getRouter() {
            return router;
        },
        addRoute(
            context: {
                method: HttpMethod,
                path: ExpressRoute,
                oapi?: {
                    pathOverride?: string,
                    pathParameters?: Param[],
                    headerParameters?: Param[],
                    queryParameters?: Param[],
                } & Omit<PathItem, 'parameters'>,
            },
            ...handlers: ExpressHandler[]
        ) {
            // actual express routing
            router[context.method](context.path, ...handlers);

            const {
                pathOverride,
                pathParameters,
                headerParameters,
                queryParameters,
                ...pathItemConfig
            } = context.oapi || {};

            // swagger doc
            const route = pathOverride ?? convertExpressPath(context.path);

            const pathItem: PathItem & Required<Pick<PathItem, 'responses' | 'parameters'>> = {
                // -- defaults --
                responses: {}, // has to be defined or else responses are not documented... ¯\_(ツ)_/¯
                // -- group defaults --
                ...(groupContext?.oapi || {}),
                // -- overrides --
                ...(pathItemConfig || {}),
                parameters: [
                    // ...(contract.pathParameters || []),
                    ...(headerParameters || []),
                    ...(queryParameters || []),
                ],
            };

            if (pathParameters?.length) {
                pathItem.parameters.push(...pathParameters);
            } else {
                pathItem.parameters.push(...tryParsePathParameters(route));
            }

            swaggerDoc.paths[route] = {
                [context.method]: pathItem,
            };

            return router;
        },
    };
}

export function expressiveServer(
    configs?: {
        helmet?: Readonly<HelmetOptions>,
        morgan?: Readonly<{
            format: string, // TODO: FormatFn
            options?: Parameters<typeof morgan>[1],
        }>,
        swagger?: {
            swaggerDoc: SwaggerConfig,
            path: ExpressRoute,
        },
    },
    app?: express.Express,
) {
    app ??= express();
    const { logger } = container;

    // secure the app
    app.use(helmet(configs?.helmet ?? {}));

    // express removes '+' sign from query string by default.
    app.set('query parser', function(str: string) {
        return qs.parse(str, { decoder(s: string) { return decodeURIComponent(s); } });
    });

    app.use(morgan(
        configs?.morgan?.format ?? ':req[x-real-ip] :method :url :status :res[content-length] - :response-time ms',
        configs?.morgan?.options ?? { stream: { write(message: string) { logger.info(message.trim()); } } },
    ));

    if (configs?.swagger?.swaggerDoc) {
        app.use(configs?.swagger.path, swaggerUi.serve, swaggerUi.setup(configs?.swagger?.swaggerDoc))
    }

    return app;
}
