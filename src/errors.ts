export class ApiError extends Error {
    public readonly code: string;
    public readonly httpStatusCode: number;
    public data?: unknown;


    constructor(message: string, httpStatusCode: number, errorCode: string) {
        super(message);
        this.name = this.constructor.name;
        this.code = errorCode;
        this.httpStatusCode = httpStatusCode;
    }

    setData<T>(data: T) {
        this.data = data;
        return this;
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class DuplicateError extends ApiError {
    constructor(message = 'Duplicate entry') {
        super(message, 409, 'DUPLICATE_ENTRY');
    }
}

export class BadRequestError extends ApiError {
    constructor(message = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}

export class SchemaValidationError extends ApiError {
    constructor(message = 'Failed to validate Schema') {
        super(message, 400, 'SCHEMA_VALIDATION_ERROR');
    }
}

export class FileTooBigError extends ApiError {
    constructor() {
        super('File too big', 400, 'FILE_TOO_BIG');
    }
}

export class InvalidFileTypeError extends ApiError {
    constructor() {
        super('Invalid file type', 400, 'INVALID_FILE_TYPE');
    }
}

export class InvalidCredentialsError extends ApiError {
    constructor() {
        super('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
}

export class InternalError extends ApiError {
    constructor() {
        super('Internal error', 500, 'INTERNAL_ERROR');
    }
}

export class TooManyRequestsError extends ApiError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'TOO_MANY_REQUESTS');
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'Action not allowed') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class TokenExpiredError extends ApiError {
    constructor(message = 'Token Expired') {
        super(message, 401, 'TOKEN_EXPIRED');
    }
}

export class UserUnauthorizedError extends ApiError {
    constructor(message = 'User unauthorized') {
        super(message, 401, 'USER_UNAUTHORIZED');
    }
}
