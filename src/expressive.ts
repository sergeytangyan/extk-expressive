import express from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import morgan from 'morgan';
import qs from 'qs';
import swaggerUi from 'swagger-ui-express';
import { convertExpressPath, tryParsePathParameters } from './swagger';
import type { Container, HttpMethod } from './types/common';
import type { ExpressHandler, ExpressRoute } from './types/expressive';
import type { AuthMethod, Param, PathItem, Servers, SwaggerConfig } from './types/swagger';


// ----------------------------------------------- //
type SwaggerOptions = {
    path?: ExpressRoute,
    doc: SwaggerConfig,
};

export function buildExpressive(container: Container, swaggerDoc: SwaggerConfig) {
    return {
        expressiveServer(configs?: { app?: express.Express }) {
            const app = configs?.app ?? express();

            const result = {
                get() {
                    return app;
                },
                withHelmet(options?: Readonly<HelmetOptions>) {
                    // secure the app
                    app.use(helmet(options ?? {}));
                    return this;
                },
                withQs() {
                    // express removes '+' sign from query string by default.
                    app.set('query parser', function(str: string) {
                        return qs.parse(str, { decoder(s: string) { return decodeURIComponent(s); } });
                    });
                    return this;
                },
                withMorgan(
                    format?: string, // TODO: FormatFn
                    options?: Parameters<typeof morgan>[1],
                ) {
                    app.use(morgan(
                        format ?? ':req[x-real-ip] :method :url :status :res[content-length] - :response-time ms',
                        options ?? { stream: { write(message: string) { container.logger.info(message.trim()); } } },
                    ));
                    return this;
                },
                withSwagger(
                    swagger: SwaggerOptions,
                    ...handlers: ExpressHandler[]
                ) {
                    app.use(swagger.path ?? '/api-docs', ...handlers, swaggerUi.serve, swaggerUi.setup(swagger.doc, {
                        customSiteTitle: swagger.doc.info?.title,
                    }));
                    return this;
                },
                defaults: {
                    get(swagger: SwaggerOptions) {
                        return result
                            .withHelmet()
                            .withQs()
                            .withMorgan()
                            .withSwagger(swagger)
                            .get();
                    },
                },
            } as const;

            return result;
        },


        expressiveRouter(configs: {
            oapi?: {
                tags?: string[],
                servers?: Servers,
                security?: AuthMethod[],
            },
        }) {
            const router = express.Router();

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

                    if (!swaggerDoc.paths[route]) {
                        swaggerDoc.paths[route] = {};
                    }
                    swaggerDoc.paths[route][context.method] = pathItem;

                    return router;
                },
            };
        },
    };
}
