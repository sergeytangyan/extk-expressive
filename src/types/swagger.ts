import type { ContentType, HttpMethod } from './common';


// ------------------------------------------------------------//
// https://swagger.io/docs/specification/v3_0/basic-structure/ //
// ------------------------------------------------------------//


export type Schema = Record<string, unknown> | { $ref: string }; // TODO
export type RequestBody = {
    content: Partial<Record<ContentType, {
        schema: Schema
    }>>,
};
export type Param = {
    in: 'path' | 'query' | 'headers', // TODO cookies
    name: string,
    desciption: string,
    required: boolean,
    schema: Schema,
};

export type Servers = {
    url: string,
    description?: string,
}[];

export type PathItem = {
    summary?: string,
    requestBody?: RequestBody,
    parameters?: Param[],
    servers?: Servers
    responses?: Record<string, Schema>, // TODO
    tags?: string[],
    operationId?: string,
    deprecated?: boolean,
    security?: AuthMethod[]
};

export type AuthMethod = Record<string, string[]>;

export type SecurityScheme = {
    type: string,
    [key: string]: any,
};

export type SwaggerConfig = {
    openapi: '3.1.0', // TODO
    info?: {
        version?: string,
        title?: string,
        termsOfService?: string,
    },
    externalDocs?: {
        url?: string,
        description?: string,
    },
    servers?: Servers,
    paths: Record<string, {
        summary?: string,
        description?: string,
        servers?: Servers,
    } & Partial<Record<HttpMethod, PathItem>>>,
    components: {
        schemas?: Record<string, Schema>,
        securitySchemes?: Record<string, SecurityScheme>,
    }, // TODO
    security?: AuthMethod[],
};
