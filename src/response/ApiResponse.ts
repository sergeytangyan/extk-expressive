export class ApiResponse<T = undefined> {
    readonly status = 'ok';
    result?: T;

    constructor(result?: T) {
        this.result = result;
    }
}
