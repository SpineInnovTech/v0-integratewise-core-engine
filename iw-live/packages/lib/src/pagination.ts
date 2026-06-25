// Standardized pagination utilities for IntegrateWise APIs
import { createAppError } from "./error-handling";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    hasNext: boolean;
    limit: number;
    nextCursor?: string;
    prevCursor?: string;
  };
}

// Standard pagination defaults
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  sortBy: "created_at",
  sortOrder: "desc" as const,
};

// Cursor pagination defaults
export const CURSOR_PAGINATION_DEFAULTS = {
  limit: 20,
  maxLimit: 100,
  sortBy: "created_at",
  sortOrder: "desc" as const,
};

/**
 * Parse and validate pagination options from URL search params
 */
export function parsePaginationOptions(searchParams: URLSearchParams): PaginationOptions {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    PAGINATION_DEFAULTS.maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || PAGINATION_DEFAULTS.limit.toString()))
  );
  const offset = parseInt(searchParams.get("offset") || "0");
  const sortBy = searchParams.get("sortBy") || PAGINATION_DEFAULTS.sortBy;
  const sortOrder = (searchParams.get("sortOrder") || PAGINATION_DEFAULTS.sortOrder) as
    | "asc"
    | "desc";

  return {
    page: offset > 0 ? Math.floor(offset / limit) + 1 : page,
    limit,
    offset: offset > 0 ? offset : (page - 1) * limit,
    sortBy,
    sortOrder,
  };
}

/**
 * Parse and validate cursor pagination options
 */
export function parseCursorPaginationOptions(
  searchParams: URLSearchParams
): CursorPaginationOptions {
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(
    CURSOR_PAGINATION_DEFAULTS.maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || CURSOR_PAGINATION_DEFAULTS.limit.toString()))
  );
  const sortBy = searchParams.get("sortBy") || CURSOR_PAGINATION_DEFAULTS.sortBy;
  const sortOrder = (searchParams.get("sortOrder") || CURSOR_PAGINATION_DEFAULTS.sortOrder) as
    | "asc"
    | "desc";

  return {
    cursor,
    limit,
    sortBy,
    sortOrder,
  };
}

/**
 * Create pagination result object
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginationResult<T> {
  const page = options.page ?? PAGINATION_DEFAULTS.page;
  const limit = options.limit ?? PAGINATION_DEFAULTS.limit;
  const offset = options.offset ?? (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      offset,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Create cursor pagination result object
 */
export function createCursorPaginationResult<T>(
  data: T[],
  hasNext: boolean,
  options: CursorPaginationOptions,
  nextCursor?: string,
  prevCursor?: string
): CursorPaginationResult<T> {
  return {
    data,
    pagination: {
      cursor: options.cursor || null,
      hasNext,
      limit: options.limit || CURSOR_PAGINATION_DEFAULTS.limit,
      ...(nextCursor && { nextCursor }),
      ...(prevCursor && { prevCursor }),
    },
  };
}

/**
 * Generate cursor from item ID and sort value
 */
export function generateCursor(id: string | number, sortValue: string | number | Date): string {
  const sortStr = sortValue instanceof Date ? sortValue.toISOString() : String(sortValue);
  return Buffer.from(`${id}:${sortStr}`).toString("base64");
}

/**
 * Parse cursor to extract ID and sort value
 */
export function parseCursor(cursor: string): { id: string; sortValue: string } {
  if (!cursor || typeof cursor !== "string") {
    throw createAppError("VALIDATION_ERROR", "Cursor must be a non-empty string");
  }

  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");

    if (!decoded.includes(":")) {
      throw createAppError("VALIDATION_ERROR", "Invalid cursor format: missing separator");
    }

    const parts = decoded.split(":");
    if (parts.length !== 2) {
      throw createAppError("VALIDATION_ERROR", "Invalid cursor format: incorrect number of parts");
    }

    const [id, sortValue] = parts;

    if (!id || !sortValue) {
      throw createAppError("VALIDATION_ERROR", "Invalid cursor format: empty id or sort value");
    }

    return { id, sortValue };
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      throw error; // Already an AppError
    }
    throw createAppError("VALIDATION_ERROR", "Invalid cursor format");
  }
}

/**
 * Validate sort field against allowed fields
 */
export function validateSortField(sortBy: string, allowedFields: string[]): boolean {
  return allowedFields.includes(sortBy);
}

/**
 * Validate sort order
 */
export function validateSortOrder(sortOrder: string): sortOrder is "asc" | "desc" {
  return sortOrder === "asc" || sortOrder === "desc";
}

/**
 * Build SQL ORDER BY clause
 */
export function buildOrderByClause(sortBy: string, sortOrder: "asc" | "desc"): string {
  return `${sortBy} ${sortOrder.toUpperCase()}`;
}

/**
 * Build SQL LIMIT and OFFSET clause
 */
export function buildLimitOffsetClause(limit: number, offset: number): string {
  return `LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Build cursor-based pagination WHERE clause
 */
export function buildCursorWhereClause(
  cursor: string | undefined,
  sortBy: string,
  sortOrder: "asc" | "desc",
  idColumn: string = "id"
): { clause: string; params: any[] } {
  if (!cursor) {
    return { clause: "", params: [] };
  }

  const { id, sortValue } = parseCursor(cursor);
  const operator = sortOrder === "asc" ? ">" : "<";
  const equalOperator = sortOrder === "asc" ? ">=" : "<=";

  // Handle different sort value types
  let paramValue: any = sortValue;
  if (sortBy.includes("at") || sortBy.includes("date") || sortBy.includes("time")) {
    // Assume timestamp fields
    paramValue = new Date(sortValue);
  } else if (!isNaN(Number(sortValue))) {
    paramValue = Number(sortValue);
  }

  const clause = `(${sortBy} ${operator} $1 OR (${sortBy} = $1 AND ${idColumn} ${operator} $2))`;
  const params = [paramValue, id];

  return { clause, params };
}

/**
 * Common pagination response headers
 */
export function getPaginationHeaders(result: PaginationResult<any>) {
  return {
    "X-Total-Count": result.pagination.total.toString(),
    "X-Total-Pages": result.pagination.totalPages.toString(),
    "X-Current-Page": result.pagination.page.toString(),
    "X-Has-Next": result.pagination.hasNext.toString(),
    "X-Has-Prev": result.pagination.hasPrev.toString(),
    "X-Page-Size": result.pagination.limit.toString(),
  };
}

/**
 * Common cursor pagination response headers
 */
export function getCursorPaginationHeaders(result: CursorPaginationResult<any>) {
  return {
    "X-Has-Next": result.pagination.hasNext.toString(),
    "X-Page-Size": result.pagination.limit.toString(),
    ...(result.pagination.nextCursor && { "X-Next-Cursor": result.pagination.nextCursor }),
    ...(result.pagination.prevCursor && { "X-Prev-Cursor": result.pagination.prevCursor }),
  };
}
