import type { ContentType, HttpMethod, OtherString, OtherUnknown } from './common';


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

type NumberSchema = { type: 'number', format?: 'float' | 'double' } & NumericConfigs;
type IntegerSchema = { type: 'integer', format?: 'int32' | 'int64' } & NumericConfigs;

type StringSchema = {
    type: 'string',
    minLength?: number,
    maxLength?: number,
    format?: 'date' | 'date-time' | 'password' | 'byte' | 'binary' | 'email' | 'uuid' | 'uri' | 'hostname' | 'ipv4' | 'ipv6' | OtherString;
    pattern?: string,
};

type BooleanSchema = {
    type: 'boolean',
};

type ArraySchema = {
    type: 'array',
    items: Partial<Schema>, // circular
    minItems?: number,
    maxItems?: number,
    uniqueItems?: boolean,
};

type ObjectSchema = {
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
        StringSchema |
        NumberSchema |
        IntegerSchema |
        BooleanSchema |
        ArraySchema |
        ObjectSchema
    )
) | { $ref: string };

// TODO: implement 'not'; a lot more to implement;
export type Schema = BaseSchema | { allOf: Schema[] } | { anyOf: Schema[] } | { oneOf: Schema[] } | OtherUnknown;  // circular


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
