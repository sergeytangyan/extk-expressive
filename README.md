<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/extk%E2%9A%A1-expressive-blue?style=for-the-badge&labelColor=1a1a2e&color=4361ee">
    <img alt="extk/expressive logo" src="https://img.shields.io/badge/extk%E2%9A%A1-expressive-blue?style=for-the-badge&labelColor=f0f0f0&color=4361ee">
  </picture>
</p>

<h3 align="center">Express 5 toolkit</h3>
<p align="center">Auto-generated OpenAPI docs, structured error handling, and logging &mdash; out of the box.</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@extk/expressive" alt="npm version">
  <img src="https://img.shields.io/node/v/@extk/expressive" alt="node version">
  <img src="https://img.shields.io/npm/l/@extk/expressive" alt="license">
</p>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [What is this?](#what-is-this)
- [Install](#install)
- [Quick Start](#quick-start)
- [Error Handling](#error-handling)
- [OpenAPI / Swagger](#openapi--swagger)
  - [File uploads](#file-uploads)
  - [Using Zod schemas for OpenAPI](#using-zod-schemas-for-openapi)
- [Middleware](#middleware)
  - [`getApiErrorHandlerMiddleware(errorMapper?)`](#getapierrorhandlermiddlewareerrormapper)
  - [`getApiNotFoundMiddleware()`](#getapinotfoundmiddleware)
  - [`getGlobalNotFoundMiddleware(content?)`](#getglobalnotfoundmiddlewarecontent)
  - [`getGlobalErrorHandlerMiddleware()`](#getglobalerrorhandlermiddleware)
  - [`getBasicAuthMiddleware(basicAuthBase64, realm?)`](#getbasicauthmiddlewarebasicauthbase64-realm)
- [silently](#silently)
- [Logging](#logging)
- [Utilities](#utilities)
- [API Response Format](#api-response-format)
- [License](#license)

---

## What is this?

`@extk/expressive` is an opinionated toolkit for Express 5 that wires up the things every API needs but nobody wants to set up from scratch:

- **Auto-generated OpenAPI 3.1 docs** from your route definitions
- **Structured error handling** with typed error classes and consistent JSON responses
- **Bring-your-own logger** — any object with `info/warn/error/debug` works
- **Security defaults** via Helmet, safe query parsing, and morgan request logging
- **Standardized responses** (`ApiResponse` / `ApiErrorResponse`) across your entire API

You write routes. Expressive handles the plumbing.

## Install

```bash
npm install @extk/expressive express
```

> Requires Node.js >= 22 and Express 5.

## Quick Start

```ts
import express from 'express';
import { bootstrap, ApiResponse, NotFoundError, SWG } from '@extk/expressive';

// 1. Bootstrap with a logger (bring your own)
const {
  expressiveServer,
  expressiveRouter,
  notFoundMiddleware,
  getErrorHandlerMiddleware,
  silently,
} = bootstrap({
  logger: console, // any object with info/warn/error/debug
});

// 2. Define routes — they auto-register in the OpenAPI spec
const { router, addRoute } = expressiveRouter({
  oapi: { tags: ['Users'] },
});

addRoute(
  {
    method: 'get',
    path: '/users/:id',
    oapi: {
      summary: 'Get user by ID',
      responses: { 200: { description: 'User found' } },
    },
  },
  async (req, res) => {
    const user = await findUser(req.params.id);
    if (!user) throw new NotFoundError('User not found');
    res.json(new ApiResponse(user));
  },
);

```

> [!IMPORTANT]
> Method call order on `ServerBuilder` matters — middleware is registered in the order you chain it.

```ts
// 3. Build the Express app
const app = expressiveServer()
  .withHelmet()
  .withQs()
  .withMorgan()
  .withRoutes(router)
  .withSwagger(
    b => b
    .withInfo({ title: 'My API', version: '1.0.0' })
    .withServers([{ url: 'http://localhost:3000' }]),
    { path: '/api-docs' },
  )
  .with((app) => {
    app.use(getErrorHandlerMiddleware());
    app.use(notFoundMiddleware);
  })
  .build();

app.listen(3000);
```

Visit `http://localhost:3000/api-docs` to see the auto-generated Swagger UI.

## Error Handling

Throw typed errors anywhere in your handlers. The error middleware catches them and returns a consistent JSON response.

```ts
import { NotFoundError, BadRequestError, ForbiddenError } from '@extk/expressive';

// Throws -> { status: "error", message: "User not found", errorCode: "NOT_FOUND" }
throw new NotFoundError('User not found');

// Attach extra data (e.g. validation details)
throw new BadRequestError('Invalid input').setData({ field: 'email', issue: 'required' });
```

Built-in error classes:

| Class                    | Status | Code                     |
| ------------------------ | ------ | ------------------------ |
| `BadRequestError`        | 400    | `BAD_REQUEST`            |
| `SchemaValidationError`  | 400    | `SCHEMA_VALIDATION_ERROR`|
| `FileTooBigError`        | 400    | `FILE_TOO_BIG`           |
| `InvalidFileTypeError`   | 400    | `INVALID_FILE_TYPE`      |
| `InvalidCredentialsError`| 401    | `INVALID_CREDENTIALS`    |
| `TokenExpiredError`      | 401    | `TOKEN_EXPIRED`          |
| `UserUnauthorizedError`  | 401    | `USER_UNAUTHORIZED`      |
| `ForbiddenError`         | 403    | `FORBIDDEN`              |
| `NotFoundError`          | 404    | `NOT_FOUND`              |
| `DuplicateError`         | 409    | `DUPLICATE_ENTRY`        |
| `TooManyRequestsError`   | 429    | `TOO_MANY_REQUESTS`      |
| `InternalError`          | 500    | `INTERNAL_ERROR`         |

You can also map external errors (e.g. Zod) via `getErrorHandlerMiddleware`:

```ts
app.use(getErrorHandlerMiddleware((err) => {
  if (err.name === 'ZodError') {
    return new SchemaValidationError('Validation failed').setData(err.issues);
  }
  return null; // let the default handler deal with it
}));
```

## OpenAPI / Swagger

Routes registered with `addRoute` are automatically added to the OpenAPI spec. Use the `SWG` helper to define parameters and schemas:

```ts
addRoute(
  {
    method: 'get',
    path: '/posts',
    oapi: {
      summary: 'List posts',
      queryParameters: [
        SWG.queryParam('page', { type: 'integer' }, false, 'Page number'),
        SWG.queryParam('limit', { type: 'integer' }, false, 'Items per page'),
      ],
      responses: {
        200: { description: 'List of posts', ...SWG.jsonSchemaRef('PostList') },
      },
    },
  },
  listPostsHandler,
);
```

### File uploads

Use `SWG.singleFileSchema` for a single file field, or `SWG.formDataSchema` for a custom multipart body:

```ts
// single file — field name defaults to 'file', required defaults to true
addRoute({
  method: 'post',
  path: '/upload',
  oapi: {
    requestBody: SWG.singleFileSchema(),
    // requestBody: SWG.singleFileSchema('avatar', true),
  },
}, handler);

// custom multipart schema with multiple fields
addRoute({
  method: 'post',
  path: '/upload/rich',
  oapi: {
    requestBody: SWG.formDataSchema({
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
      },
      required: ['file'],
    }),
  },
}, handler);
```

Configure security schemes via the `configure` callback in `withSwagger`:

```ts
.withSwagger(b => b
  .withSecuritySchemes({
    BearerAuth: SWG.securitySchemes.BearerAuth(),
  })
  .withDefaultSecurity([SWG.security('BearerAuth')]),
  {},
)
```

### Using Zod schemas for OpenAPI

You can use Zod's global registry to define your schemas once and have them appear in both validation and OpenAPI docs automatically.

**1. Define schemas with `.meta({ id })` to register them globally:**

```ts
// schema/userSchema.ts
import z from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['admin', 'user']),
}).meta({ id: 'createUser' });

export const patchUserSchema = createUserSchema.partial().meta({ id: 'patchUser' });

export const loginSchema = z.object({
  username: z.string().email(),
  password: z.string(),
}).meta({ id: 'login' });
```

**2. Pass all registered schemas to the swagger builder:**

```ts
import z from 'zod';

const app = expressiveServer()
  .withHelmet()
  .withQs()
  .withMorgan()
  .withSwagger(b => b
    .withInfo({ title: 'My API' })
    .withServers([{ url: 'http://localhost:3000/api' }])
    .withSchemas(z.toJSONSchema(z.globalRegistry).schemas) // all Zod schemas -> OpenAPI
    .withSecuritySchemes({ auth: SWG.securitySchemes.BearerAuth() })
    .withDefaultSecurity([SWG.security('auth')]),
    {},
  )
  .build();
```

**3. Reference them in routes with `SWG.jsonSchemaRef`:**

```ts
addRoute({
  method: 'post',
  path: '/user',
  oapi: {
    summary: 'Create a user',
    requestBody: SWG.jsonSchemaRef('createUser'),
  },
}, async (req, res) => {
  const body = createUserSchema.parse(req.body); // validate with the same schema
  const result = await userController.createUser(body);
  res.status(201).json(new ApiResponse(result));
});

addRoute({
  method: 'patch',
  path: '/user/:id',
  oapi: {
    summary: 'Update a user',
    requestBody: SWG.jsonSchemaRef('patchUser'),
  },
}, async (req, res) => {
  const id = parseIdOrFail(req.params.id);
  const body = patchUserSchema.parse(req.body);
  const result = await userController.updateUser(id, body);
  res.json(new ApiResponse(result));
});
```

This way your Zod schemas serve as the single source of truth for both runtime validation and API documentation.

## Middleware

All middleware factories are returned from `bootstrap()`.

### `getApiErrorHandlerMiddleware(errorMapper?)`

Express error handler for API routes. Catches `ApiError` subclasses, handles malformed JSON, and falls back to `InternalError` for unknown errors. Pass an optional `errorMapper` to map third-party errors (e.g. Zod, Multer) to typed `ApiError` instances.

```ts
app.use(getApiErrorHandlerMiddleware((err) => {
  if (err.name === 'ZodError') return new SchemaValidationError('Validation failed').setData(err.issues);
  return null;
}));
```

### `getApiNotFoundMiddleware()`

Returns a JSON `404` response for unmatched API routes.

```ts
app.use(getApiNotFoundMiddleware());
// { status: 'error', message: 'GET /unknown not found', errorCode: 'NOT_FOUND' }
```

### `getGlobalNotFoundMiddleware(content?)`

Returns a plain-text `404`. Useful as the last catch-all for non-API routes. Defaults to `¯\_(ツ)_/¯`.

```ts
app.use(getGlobalNotFoundMiddleware());
app.use(getGlobalNotFoundMiddleware('Not found'));
```

### `getGlobalErrorHandlerMiddleware()`

Minimal error handler that logs and responds with a plain-text `500`. Use this outside of API route groups where JSON responses aren't expected.

### `getBasicAuthMiddleware(basicAuthBase64, realm?)`

Protects a route or the Swagger UI with HTTP Basic auth. Accepts a pre-encoded base64 `user:password` string.

```ts
expressiveServer()
  .withSwagger(
    b => b,
    { path: '/api-docs' },
    getBasicAuthMiddleware(process.env.SWAGGER_AUTH!, 'API Docs'),
  )
```

## silently

`silently` runs a function — sync or async — and suppresses any errors it throws. Errors are forwarded to `alertHandler` (if configured) or logged via the container logger.

```ts
// fire-and-forget without crashing the process
silently(() => sendAnalyticsEvent(req));
silently(async () => await notifySlack('Server started'));
```

## Logging

Expressive does not bundle a logger. Instead, `bootstrap` accepts any object that satisfies the `Logger` interface:

```ts
export type Logger = {
  info(message: string, ...args: any[]): void;
  error(message: string | Error | unknown, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
};
```

This means you can pass `console` directly, or plug in any logging library (Winston, Pino, etc.):

```ts
bootstrap({ logger: console });
```

The `@extk/logger-cloudwatch` package from the same org is a drop-in fit:

```ts
import { getCloudwatchLogger, getConsoleLogger } from '@extk/logger-cloudwatch';

// development
bootstrap({ logger: getConsoleLogger() });

// production — streams structured JSON logs to AWS CloudWatch
bootstrap({
  logger: getCloudwatchLogger({
    aws: {
      region: 'us-east-1',
      logGroup: '/my-app/production',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    },
  }),
});
```

## Utilities

```ts
import {
  slugify,
  parseDefaultPagination,
  parseIdOrFail,
  getEnvVar,
  isDev,
  isProd,
} from '@extk/expressive';

slugify('Hello World!');           // 'hello-world!'
parseDefaultPagination({ page: '2', limit: '25' }); // { offset: 25, limit: 25 }
parseIdOrFail('42');               // 42 (throws on invalid)
getEnvVar('DATABASE_URL');         // string (throws if missing)
isDev();                           // true when ENV !== 'prod'
```

## API Response Format

All responses follow a consistent shape:

```jsonc
// Success
{ "status": "ok", "result": { /* ... */ } }

// Error
{ "status": "error", "message": "Not found", "errorCode": "NOT_FOUND", "errors": null }
```

## License

ISC
