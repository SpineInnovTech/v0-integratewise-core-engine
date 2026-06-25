/**
 * Database Provider Abstraction Layer
 * Supports: Supabase (PostgreSQL), Cloudflare D1
 */

export interface QueryOptions {
  timeout?: number
  cache?: boolean
}

export interface QueryResult<T = any> {
  data: T[] | null
  error: Error | null
  count?: number
}

export interface DatabaseProvider {
  /**
   * Execute a SELECT query
   */
  query<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>>

  /**
   * Execute an INSERT query
   */
  insert<T = any>(
    table: string,
    data: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult<T>>

  /**
   * Execute an UPDATE query
   */
  update<T = any>(
    table: string,
    updates: Record<string, any>,
    where: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult<T>>

  /**
   * Execute a DELETE query
   */
  delete(
    table: string,
    where: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult>

  /**
   * Execute a raw SQL query (use with caution)
   */
  raw<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>>

  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<void>

  /**
   * Commit current transaction
   */
  commit(): Promise<void>

  /**
   * Rollback current transaction
   */
  rollback(): Promise<void>

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>

  /**
   * Provider name identifier
   */
  provider: 'supabase' | 'd1'
}

/**
 * Entity schema for type-safe operations
 */
export interface EntitySchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date' | 'json'
    required?: boolean
    unique?: boolean
  }
}
