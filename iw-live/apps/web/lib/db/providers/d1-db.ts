/**
 * Cloudflare D1 Database Provider Implementation
 */

import type { DatabaseProvider, QueryResult, QueryOptions } from '../types'

// D1 binding would be injected via Cloudflare environment
declare global {
  const DB: D1Database
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement
  batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(sql: string): Promise<D1Result>
}

interface D1PreparedStatement {
  bind(...params: any[]): this
  first<T = any>(column?: string): Promise<T | null>
  all<T = any>(): Promise<D1Result<T>>
  run(): Promise<D1Result>
}

interface D1Result<T = any> {
  success: boolean
  error?: string
  results?: T[]
  meta?: {
    duration: number
    last_row_id?: string
    changes?: number
    served_by?: string
  }
}

export const d1DatabaseProvider: DatabaseProvider = {
  provider: 'd1',

  async query<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      const statement = DB.prepare(sql)
      
      if (params && params.length > 0) {
        statement.bind(...params)
      }

      const result = await statement.all<T>()

      if (!result.success) {
        return { data: null, error: new Error(result.error || 'Query failed') }
      }

      return { data: result.results || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async insert<T = any>(
    table: string,
    data: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      const columns = Object.keys(data)
      const placeholders = columns.map(() => '?').join(',')
      const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders}) RETURNING *`
      const values = Object.values(data)

      const statement = DB.prepare(sql).bind(...values)
      const result = await statement.all<T>()

      if (!result.success) {
        return { data: null, error: new Error(result.error || 'Insert failed') }
      }

      return { data: result.results || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async update<T = any>(
    table: string,
    updates: Record<string, any>,
    where: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      const updateColumns = Object.keys(updates).map((k) => `${k} = ?`).join(',')
      const whereColumns = Object.keys(where).map((k) => `${k} = ?`).join(' AND ')
      const sql = `UPDATE ${table} SET ${updateColumns} WHERE ${whereColumns} RETURNING *`
      const values = [...Object.values(updates), ...Object.values(where)]

      const statement = DB.prepare(sql).bind(...values)
      const result = await statement.all<T>()

      if (!result.success) {
        return { data: null, error: new Error(result.error || 'Update failed') }
      }

      return { data: result.results || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async delete(
    table: string,
    where: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult> {
    try {
      const whereColumns = Object.keys(where).map((k) => `${k} = ?`).join(' AND ')
      const sql = `DELETE FROM ${table} WHERE ${whereColumns}`
      const values = Object.values(where)

      const statement = DB.prepare(sql).bind(...values)
      const result = await statement.run()

      if (!result.success) {
        return { data: null, error: new Error(result.error || 'Delete failed') }
      }

      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async raw<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      const statement = DB.prepare(sql)
      
      if (params && params.length > 0) {
        statement.bind(...params)
      }

      const result = await statement.all<T>()

      if (!result.success) {
        return { data: null, error: new Error(result.error || 'Query failed') }
      }

      return { data: result.results || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async beginTransaction(): Promise<void> {
    try {
      const result = await DB.prepare('BEGIN TRANSACTION').run()
      if (!result.success) throw new Error(result.error || 'Failed to begin transaction')
    } catch (error) {
      throw error
    }
  },

  async commit(): Promise<void> {
    try {
      const result = await DB.prepare('COMMIT').run()
      if (!result.success) throw new Error(result.error || 'Failed to commit')
    } catch (error) {
      throw error
    }
  },

  async rollback(): Promise<void> {
    try {
      const result = await DB.prepare('ROLLBACK').run()
      if (!result.success) throw new Error(result.error || 'Failed to rollback')
    } catch (error) {
      throw error
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const result = await DB.prepare('SELECT 1').first()
      return result !== null
    } catch {
      return false
    }
  },
}
