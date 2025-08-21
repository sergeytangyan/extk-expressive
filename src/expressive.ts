import express from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import morgan from 'morgan';
import qs from 'qs';
import { convertExpressPath, globalSwaggerDoc, tryParsePathParameters } from './swagger';
import type { HttpMethod } from './types/common';
import type { ExpressRoute, ExpressHandler } from './types/expressive';
import type { Servers, AuthMethod, Param, PathItem } from './types/swagger';
import { container } from './container';


// ----------------------------------------------- //
export function expressiveRouter(
    router?: express.Router,
    oapi?: {
        tags?: string[],
        servers?: Servers,
        security?: AuthMethod[]
    },
) {
    if (!router) {
        router = express.Router();
    }

    return {
        getRouter() {
            return router;
        },
        addRoute(
            context: {
                method: HttpMethod,
                path: ExpressRoute,
                oapi: {
                    pathOverride?: string,
                    pathParameters?: Param[],
                    headerParameters?: Param[],
                    queryParameters?: Param[],
                } & Omit<PathItem, 'parameters'>,
            },
            ...handlers: ExpressHandler[]
        ) {
            const {
                pathOverride,
                pathParameters,
                headerParameters,
                queryParameters,
                ...pathItemConfig
            } = context.oapi;

            // actual express routing
            router[context.method](context.path, ...handlers);

            // swagger doc
            const route = pathOverride ?? convertExpressPath(context.path);

            const pathItem: PathItem & Required<Pick<PathItem, 'responses' | 'parameters'>> = {
                // -- defaults --
                responses: {}, // has to be defined or else responses are not documented... ¯\_(ツ)_/¯
                // -- group defaults --
                ...oapi,
                // -- overrides --
                ...pathItemConfig,
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


            globalSwaggerDoc.paths[route] = {
                [context.method]: pathItem,
            };

            return router;
        },
    };
}

export function expressiveServer(
    app?: express.Express,
    configs?: {
        helmet?: Readonly<HelmetOptions>,
        morgan?: {
            format?: string,
            stream?: morgan.StreamOptions,
        },
    },
) {
    if (!app) {
        app = express();
    }

    const { logger } = container;

    // secure the app
    app.use(helmet(configs?.helmet ?? {}));

    // express removes '+' sign from query string by default.
    app.set('query parser', function(str: string) {
        return qs.parse(str, { decoder(s: string) { return decodeURIComponent(s); } });
    });

    app.use(morgan(
        configs?.morgan?.format ?? ':req[x-real-ip] :method :url :status :res[content-length] - :response-time ms',
        { stream: configs?.morgan?.stream ?? { write(message: string) { logger.info(message.trim()); } } },
    ));

    return app;
}
