import express from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import morgan from 'morgan';
import qs from 'qs';
import swaggerUi from 'swagger-ui-express';
import { convertExpressPath, globalSwaggerDoc, tryParsePathParameters } from './swagger';
import type { Container, HttpMethod } from './types/common';
import type { ExpressHandler, ExpressRoute } from './types/expressive';
import type { AuthMethod, Param, PathItem, Servers, SwaggerConfig } from './types/swagger';


// ----------------------------------------------- //
export function expressiveRouter(configs: {
    swaggerDoc?: SwaggerConfig,
    oapi?: {
        tags?: string[],
        servers?: Servers,
        security?: AuthMethod[]
    },
    router?: express.Router,
}) {
    const router = configs.router ?? express.Router();
    const swaggerDoc = configs?.swaggerDoc ?? globalSwaggerDoc;

    return {
        router,
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
                ...(configs?.oapi || {}),
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

export function expressiveServer(configs: {
    container: Container,
    options?: {
        helmet?: Readonly<HelmetOptions>,
        morgan?: Readonly<{
            format: string, // TODO: FormatFn
            options?: Parameters<typeof morgan>[1],
        }>,
    },
    swagger?: {
        swaggerDoc: SwaggerConfig,
        path: ExpressRoute,
    },
    app?: express.Express,
}) {
    const { container, options, swagger } = configs;
    const app = configs.app ?? express();

    // secure the app
    app.use(helmet(options?.helmet ?? {}));

    // express removes '+' sign from query string by default.
    app.set('query parser', function(str: string) {
        return qs.parse(str, { decoder(s: string) { return decodeURIComponent(s); } });
    });

    app.use(morgan(
        options?.morgan?.format ?? ':req[x-real-ip] :method :url :status :res[content-length] - :response-time ms',
        options?.morgan?.options ?? { stream: { write(message: string) { container.logger.info(message.trim()); } } },
    ));

    if (swagger?.swaggerDoc) {
        app.use(swagger.path, swaggerUi.serve, swaggerUi.setup(swagger?.swaggerDoc))
    }

    return app;
}
