export class ApiResponse<T = undefined> {
    status = 'ok';
    result?: T;

    constructor(result?: T) {
        this.result = result;
    }
}
