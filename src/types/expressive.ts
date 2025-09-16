/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RequestHandler } from 'express';
import type { RouteParameters } from 'express-serve-static-core';

export type ExpressRoute = string;
export type ExpressLocalsObj = Record<string, any>;
export type ExpressHandler = RequestHandler<RouteParameters<ExpressRoute>, any, any, qs.ParsedQs, ExpressLocalsObj[]>;


export type PaginationQuery = {
    limit?: string | number,
    page?: string | number,
};

export type Pagination = {
    limit: number,
    offset: number,
};

export type ReqSnapshot = {
    readonly query: qs.ParsedQs;
    readonly path: string;
    readonly method: string;
    readonly userId: string | number | undefined;
};

