import path from 'path';
import type { Pagination, PaginationQuery } from './types/expressive';
import { ApiError } from './errors';


export function parsePositiveInteger<T>(v: T, defaultValue: number, max?: number) {
    const value = Number(v);
    return Number.isInteger(value) && value > 0 && (!max || value <= max) ? value : defaultValue;
}

export function parseIdOrFail(v: unknown): number {
    const value = Number(v);

    if (!Number.isInteger(value) || value <= 0) {
        throw new ApiError('Invalid Id', 400, 'INVALID_ID');
    }

    return value;
}

export function slugify(text: string) {
    return text
        .toString()                   // Cast to string (optional)
        .normalize('NFKD')            // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
        .toLowerCase()                // Convert the string to lowercase letters
        .trim()                       // Remove whitespace from both sides of a string (optional)
        .replace(/[\s\n_+.]/g, '-')
        .replace(/--+/g, '-');        // Replace multiple - with single -
    // .replace(/[^\w-]+/g, '')     // Remove all non-word chars
}

export function getTmpDir() {
    return path.resolve('tmp');
}

export function getTmpPath(...steps: string[]) {
    return path.join(getTmpDir(), ...steps);
}

export function parseDefaultPagination(query: PaginationQuery): Pagination {
    const limit = parsePositiveInteger(query.limit, 50, 100);
    const page = parsePositiveInteger(query.page, 1, 1000);
    const offset = (page - 1) * limit;

    return { limit, offset };
}

// TODO
// export function silently(fn: () => Promise<void>, reqSnapshot ?: Record<string, unknown>) {
//     fn()
//         .catch(e => this.mailerService.sendAlert(e, reqSnapshot))
//         .catch(e => {
//             this.logger.warn('Failed to send alert email');
//             this.logger.error(e);
//         });
// }
