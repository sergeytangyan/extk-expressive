import type { ContentType, HttpMethod } from './common';


// ------------------------------------------------------------//
// https://swagger.io/docs/specification/v3_0/basic-structure/ //
// ------------------------------------------------------------//

type NumericConfigs = {
    minimum?: number,
    maximum?: number,
    exclusiveMinimum?: boolean,
    exclusiveMaximum?: boolean,
    multipleOf?: number,
};

type NumberType = { type: 'number', format?: 'float' | 'double' } & NumericConfigs;
type IntegerType = { type: 'integer', format?: 'int32' | 'int64' } & NumericConfigs;
type StringType = {
    type: 'string',
    minLength?: number,
    maxLength?: number,
    format?: 'date' | 'date-time' | 'password' | 'byte' | 'binary' | 'email' | 'uuid' | 'uri' | 'hostname' | 'ipv4' | 'ipv6';
    pattern?: string,
};
type BooleanType = {
    type: 'boolean',
};

type ArrayType = {
    type: 'array',
    items: Partial<Schema>, // circular
    minItems?: number,
    maxItems?: number,
    uniqueItems?: boolean,
};

type ObjectType = {
    type: 'object',
    properties?: Record<string, Schema>, // circular
    required?: string[],
    additionalProperties?: boolean | Schema, // circular
    minProperties?: number,
    maxProperties?: number,
};

type BaseSchema = (
    {
        nullable?: boolean,
        enum?: unknown[],
        description?: string,
        default?: unknown,
    } & (
        StringType |
        NumberType |
        IntegerType |
        BooleanType |
        ArrayType |
        ObjectType
    )
) |
{ $ref: string };

export type Schema = BaseSchema | { allOf: BaseSchema[] } | { anyOf: BaseSchema[] } | { oneOf: BaseSchema[] };


export type Content = {
    description?: string,
    content?: Partial<Record<ContentType, {
        schema: Schema
    }>>,
};
export type Param = {
    in: 'path' | 'query' | 'headers', // TODO cookies
    name: string,
    description: string,
    required: boolean,
    schema: Schema,
};

export type Servers = {
    url: string,
    description?: string,
}[];

export type PathItem = {
    summary?: string,
    requestBody?: Content,
    parameters?: Param[],
    servers?: Servers
    responses?: Record<string, Content>,
    tags?: string[],
    operationId?: string,
    deprecated?: boolean,
    security?: AuthMethod[]
};

export type AuthMethod = Record<string, string[]>;

export type SecurityScheme = {
    type: 'http',
    scheme: 'basic' | 'bearer',
} | {
    type: 'apiKey',
    in: 'header',
    name: string,
} | {
    type: 'openIdConnect',
    openIdConnectUrl: string,
} | {
    type: 'oauth2',
    flows: {
        authorizationCode: {
            authorizationUrl: string,
            tokenUrl: string,
            scopes: Record<string, string>,
        },
    },
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
