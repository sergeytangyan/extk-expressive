import type { ExpressRoute } from './types/expressive';
import type { AuthMethod, Param, RequestBody, Schema, SecurityScheme, Servers, SwaggerConfig } from './types/swagger';


export const globalSwaggerDoc: SwaggerConfig = {
    openapi: '3.1.0',
    info: {},
    paths: {},
    components: {},
};

export const swaggerBuilder = (info: SwaggerConfig['info']) => {
    globalSwaggerDoc.info = info;
    return {
        withServers(servers: Servers) {
            globalSwaggerDoc.servers = servers;
            return this;
        },
        withSecuritySchemes(schemes: Record<string, SecurityScheme>) {
            globalSwaggerDoc.components.securitySchemes = schemes;
            return this;

        },
        withSchemas(schemas: Record<string, Schema>) {
            globalSwaggerDoc.components.schemas = schemas;
            return this;
        },
        withGlobalSecurity(globalAuthMethods: AuthMethod[]) {
            globalSwaggerDoc.security = globalAuthMethods;
            return this;
        },
        get() {
            return globalSwaggerDoc;
        },
    };
};

export const securitySchemes = {
    BasicAuth: (): SecurityScheme => ({
        type: 'http',
        scheme: 'basic',
    }),
    BearerAuth: (): SecurityScheme => ({
        type: 'http',
        scheme: 'bearer',
    }),
    ApiKeyAuth: (headerName: string): SecurityScheme => ({
        type: 'apiKey',
        in: 'header',
        name: headerName,
    }),
    OpenID: (openIdConnectUrl: string): SecurityScheme => ({
        type: 'openIdConnect',
        openIdConnectUrl,
    }),
    OAuth2: (authorizationUrl: string, tokenUrl: string, scopes: Record<string, string>): SecurityScheme => ({
        type: 'oauth2',
        flows: {
            authorizationCode: {
                authorizationUrl,
                tokenUrl,
                scopes,
            },
        },
    }),
} as const;

export const security = {
    NONE: [],
    NAMED: (name: string): AuthMethod => ({ [name]: [] }),
};

// ----------------------------------------------- //
function jsonSchema(schema: Schema): RequestBody {
    return {
        content: {
            'application/json': {
                schema,
            },
        },
    };
}

function jsonSchemaRef(name: string): RequestBody {
    return jsonSchema({ $ref: `#/components/schemas/${name}` });
}

// ----------------------------------------------- //

function param(inP: Param['in'], id: string, schema: Schema, required = true, description = '', name?: string): Param {
    return {
        in: inP,
        name: name ?? id,
        desciption: description,
        required,
        schema,
    };
}

function pathParam(id: string, schema: Schema, required = true, description = '', name?: string): Param {
    return param('path', id, schema, required, description, name);
}

function queryParam(id: string, schema: Schema, required = true, description = '', name?: string): Param {
    return param('query', id, schema, required, description, name);
}

function headerParam(id: string, schema: Schema, required = true, description = '', name?: string): Param {
    return param('headers', id, schema, required, description, name);
}

// ----------------------------------------------- //

export function convertExpressPath(path: ExpressRoute): string {
    // /voting/nomination/:nominationId/:*/:userId
    // /voting/nomination/{nominationId}/{*}/{userId}
    return path.replace(/:([a-zA-Z0-9_*]+)/g, '{$1}');
}

export function tryParsePathParameters(path: string): Param[] {
    const matches = path.match(/(?<={)[^}]+(?=})/g);
    if (!matches) {
        return [];
    }

    return matches.map(pp => pathParam(pp, { type: 'string' }));
}

export const SWG = {
    param,
    pathParam,
    queryParam,
    headerParam,
    jsonSchema,
};
