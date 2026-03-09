/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RequestHandler } from 'express';
import type { Query, RouteParameters } from 'express-serve-static-core';

export type ExpressRoute = string;
export type ExpressLocalsObj = Record<string, any>;
export type ExpressHandler = RequestHandler<RouteParameters<ExpressRoute>, any, any, Query, ExpressLocalsObj>;


export type PaginationQuery = {
    limit?: string | number,
    page?: string | number,
};

export type Pagination = {
    limit: number,
    offset: number,
};
