export class ApiErrorResponse<T = undefined> {
    readonly status = 'error';
    readonly message: string;
    readonly errorCode: string;
    readonly errors?: T;


    constructor(message: string, errorCode: string, errors?: T) {
        this.message = message;
        this.errorCode = errorCode;
        this.errors = errors;
    }
}
