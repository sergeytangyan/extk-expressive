import path from 'path';
import type { Pagination, PaginationQuery, ReqSnapshot } from './types/expressive';
import type { Request } from 'express';
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

export function createReqSnapshot(req: Request & { user?: { id?: string | number } }): ReqSnapshot {
    return {
        query: req.query,
        path: req.path,
        method: req.method,
        userId: req?.user?.id,
    } as const;
}
