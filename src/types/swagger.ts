import type { ContentType, HttpMethod, OtherString, OtherUnknown } from './common';


// ------------------------------------------------------------//
// https://swagger.io/docs/specification/v3_0/basic-structure/ //
// ------------------------------------------------------------//

// allows type: 'string' or type: ['string', 'null']
type Nullable<T extends string> = T | [T, 'null'] | ['null', T];

type NumericConfigs = {
    minimum?: number,
    maximum?: number,
    exclusiveMinimum?: number,
    exclusiveMaximum?: number,
    multipleOf?: number,
};

type NumberSchema = { type: Nullable<'number'>, format?: 'float' | 'double' } & NumericConfigs;
type IntegerSchema = { type: Nullable<'integer'>, format?: 'int32' | 'int64' } & NumericConfigs;

type StringSchema = {
    type: Nullable<'string'>,
    minLength?: number,
    maxLength?: number,
    format?: 'date' | 'date-time' | 'password' | 'byte' | 'binary' | 'email' | 'uuid' | 'uri' | 'hostname' | 'ipv4' | 'ipv6' | OtherString;
    pattern?: string,
};

type BooleanSchema = {
    type: Nullable<'boolean'>,
};

type NullSchema = {
    type: 'null',
};

type ArraySchema = {
    type: Nullable<'array'>,
    items?: Schema, // circular
    minItems?: number,
    maxItems?: number,
    uniqueItems?: boolean,
};

type ObjectSchema = {
    type: Nullable<'object'>,
    properties?: Record<string, Schema>, // circular
    required?: string[],
    additionalProperties?: boolean | Schema, // circular
    minProperties?: number,
    maxProperties?: number,
};

type Discriminator = {
    propertyName: string,
    mapping?: Record<string, string>,
};

type CommonSchemaProps = {
    title?: string,
    description?: string,
    example?: unknown,
    default?: unknown,
    enum?: unknown[],
    const?: unknown,
    readOnly?: boolean,
    writeOnly?: boolean,
    deprecated?: boolean,
};

// in OAS 3.1, $ref can coexist with other properties
type BaseSchema = CommonSchemaProps & (
    StringSchema |
    NumberSchema |
    IntegerSchema |
    BooleanSchema |
    NullSchema |
    ArraySchema |
    ObjectSchema |
    { $ref: string }
);

export type Schema = // circular
    BaseSchema |
    (CommonSchemaProps & { allOf: Schema[], discriminator?: Discriminator }) |
    (CommonSchemaProps & { anyOf: Schema[], discriminator?: Discriminator }) |
    (CommonSchemaProps & { oneOf: Schema[], discriminator?: Discriminator }) |
    (CommonSchemaProps & { not: Schema }) |
    (CommonSchemaProps & { if: Schema, then?: Schema, else?: Schema }) |
    OtherUnknown;


export type Content = {
    description?: string,
    content?: Partial<Record<ContentType, {
        schema: Schema
    }>>,
};
export type Param = {
    in: 'path' | 'query' | 'header' | 'cookie',
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
    description?: string,
    requestBody?: Content,
    parameters?: Param[],
    servers?: Servers
    responses?: Record<string, Content>,
    tags?: string[],
    operationId?: string,
    deprecated?: boolean,
    security?: AuthMethod[]
};

/** { BearerAuth: [] } | { OAuth2: ['read', 'write'] } */
export type AuthMethod = Record<string, string[]>;

export type SecurityScheme = {
    type: 'http',
    scheme: 'basic' | 'bearer',
} | {
    type: 'apiKey',
    in: 'header' | 'query' | 'cookie',
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
    openapi: '3.1.0',
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
