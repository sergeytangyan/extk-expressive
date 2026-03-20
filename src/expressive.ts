import express from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import morgan from 'morgan';
import swaggerUi, { type SwaggerOptions, type SwaggerUiOptions } from 'swagger-ui-express';
import { convertExpressPath, SwaggerBuilder, tryParsePathParameters } from './swagger';
import type { Container, HttpMethod } from './types/common';
import type { ExpressHandler, ExpressRoute } from './types/expressive';
import type { AuthMethod, Param, PathItem, Servers, SwaggerConfig } from './types/swagger';


// allowing null cause we are going to hard delete the object, not to store in memory
type SwaggerRef = {
    doc?: SwaggerConfig | null;
    bootstrapOptions?: SwaggerBootstrapOpts | null;
};

type SwaggerBootstrapOpts = {
    enabled?: boolean;
    configure?: (builder: SwaggerBuilder) => void;
    uiOpts?: SwaggerUiOptions;
    options?: SwaggerOptions;
    customCss?: string;
    customfavIcon?: string;
    swaggerUrl?: string;
    customSiteTitle?: string;
};

export type BuildExpressiveOpts = {
    swagger?: SwaggerBootstrapOpts;
};

export class ServerBuilder {
    constructor(
        private app: express.Express,
        private container: Container,
        private swaggerRef: SwaggerRef,
    ) { }

    build() {
        if (this.swaggerRef) {
            this.swaggerRef.doc = null; // release from memory
            this.swaggerRef.bootstrapOptions = null; // release from memory
        }
        return this.app;
    }

    withHelmet(options?: Readonly<HelmetOptions>) {
        // secure the app
        this.app.use(helmet(options ?? {}));
        return this;
    }

    withMorgan(
        format?: string | morgan.FormatFn,
        options?: Parameters<typeof morgan>[1],
    ) {
        this.app.use(morgan(
            (format ?? ':remote-addr :method :url :status :res[content-length] - :response-time ms') as string,
            options ?? { stream: { write: (message: string) => { this.container.logger.info(message.trim()); } } },
        ));
        return this;
    }

    withRoutes(routes: express.Router) {
        this.app.use(routes);
        return this;
    }

    /**
     * Helper function for fluent design
     */
    with(fn: (app: express.Express, container: Container) => void) {
        fn(this.app, this.container);
        return this;
    }

    withSwagger(path = '/api-docs', ...handlers: ExpressHandler[]) {
        if (!this.swaggerRef || !this.swaggerRef.doc) {
            return this;
        }

        const doc = this.swaggerRef.doc;
        const {
            configure,
            uiOpts,
            options,
            customCss,
            customfavIcon,
            swaggerUrl,
            customSiteTitle,
        } = this.swaggerRef.bootstrapOptions ?? {};

        if (configure) {
            configure(new SwaggerBuilder(doc));
        }

        this.app.use(path,
            ...handlers,
            swaggerUi.serve,
            swaggerUi.setup(
                doc,
                { customSiteTitle: doc.info?.title, ...uiOpts },
                options,
                customCss,
                customfavIcon,
                swaggerUrl,
                customSiteTitle,
            ),
        );

        return this;
    }
}

export function buildExpressive(container: Container, opts?: BuildExpressiveOpts) {
    const swaggerBootstrapOpts = opts?.swagger;

    // no config = no swagger no matter what; with 'enabled' flag you can control swagger conditionally;
    const swaggerRef: SwaggerRef = (!swaggerBootstrapOpts || swaggerBootstrapOpts.enabled === false)
        ? {}
        : {
            doc: { openapi: '3.1.0', info: {}, paths: {}, components: {} },
            bootstrapOptions: swaggerBootstrapOpts,
        };

    return {
        expressiveServer(configs?: { app?: express.Express }): ServerBuilder {
            const app = configs?.app ?? express();
            return new ServerBuilder(app, container, swaggerRef);
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

                    // swagger
                    if (swaggerRef?.doc) {
                        const {
                            pathOverride,
                            pathParameters,
                            headerParameters,
                            queryParameters,
                            ...pathItemConfig
                        } = context.oapi || {};

                        const route = pathOverride ?? convertExpressPath(context.path);

                        const pathItem: PathItem & Required<Pick<PathItem, 'responses' | 'parameters'>> = {
                            // -- defaults --
                            responses: { // has to be defined or else responses are not documented... ¯\_(ツ)_/¯
                                '200': { description: 'OK' },
                                '201': { description: 'Created' },
                                '204': { description: 'No Content' },
                                '400': { description: 'Bad Request' },
                                '401': { description: 'User Unauthorized' },
                                '403': { description: 'Forbidden' },
                                '500': { description: 'Internal Server Error' },
                            },
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

                        if (!swaggerRef.doc.paths[route]) {
                            swaggerRef.doc.paths[route] = {};
                        }
                        swaggerRef.doc.paths[route][context.method] = pathItem;
                    }

                    return router;
                },
            };
        },
    } as const;
}
