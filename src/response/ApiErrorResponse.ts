export class ApiErrorResponse<T = undefined> {
    public readonly status = 'error';
    public readonly message: string;
    public readonly errorCode: string;
    public readonly errors?: T;


    constructor(message: string, errorCode: string, errors?: T) {
        this.message = message;
        this.errorCode = errorCode;
        this.errors = errors;
    }
}
