// Universal database manager that switches between SQLite and PostgreSQL
import dbManager from './index'  // SQLite manager
import postgresManager from './postgres'  // PostgreSQL manager
import { QueryBuilder } from './queryBuilder'

interface DatabaseResult {
  id?: number
  affectedRows?: number
  changes?: number
}

interface UniversalDatabaseManager {
  initialize(): Promise<void>
  get<T extends Record<string, any> = any>(sql: string, params?: any[]): Promise<T | null>
  all<T extends Record<string, any> = any>(sql: string, params?: any[]): Promise<T[]>
  run(sql: string, params?: any[]): Promise<DatabaseResult>
  close(): Promise<void>
  healthCheck(): Promise<boolean>
}

class UniversalDatabaseAdapter implements UniversalDatabaseManager {
  private usePostgres: boolean
  public queryBuilder: QueryBuilder

  constructor() {
    // Use PostgreSQL if DATABASE_URL is set, otherwise fall back to SQLite
    this.usePostgres = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL)
    this.queryBuilder = new QueryBuilder(this.usePostgres ? 'postgres' : 'sqlite')
    
    if (this.usePostgres) {
      console.log('🐘 Using PostgreSQL database')
    } else {
      console.log('🗃️ Using SQLite database')
    }
  }

  async initialize(): Promise<void> {
    if (this.usePostgres) {
      await postgresManager.initialize()
    } else {
      await dbManager.connect()
      await dbManager.runMigrations()
    }
  }

  async get<T extends Record<string, any> = any>(sql: string, params?: any[]): Promise<T | null> {
    if (this.usePostgres) {
      // Convert ? placeholders to $1, $2, etc for PostgreSQL
      const convertedSql = this.queryBuilder.buildQuery(sql)
      return await postgresManager.get<T>(convertedSql, params)
    } else {
      return await dbManager.get<T>(sql, params)
    }
  }

  async all<T extends Record<string, any> = any>(sql: string, params?: any[]): Promise<T[]> {
    if (this.usePostgres) {
      // Convert ? placeholders to $1, $2, etc for PostgreSQL
      const convertedSql = this.queryBuilder.buildQuery(sql)
      return await postgresManager.all<T>(convertedSql, params)
    } else {
      return await dbManager.all<T>(sql, params)
    }
  }

  async run(sql: string, params?: any[]): Promise<DatabaseResult> {
    if (this.usePostgres) {
      // Convert ? placeholders to $1, $2, etc for PostgreSQL
      const convertedSql = this.queryBuilder.buildQuery(sql, sql.toLowerCase().trim().startsWith('insert'))
      const result = await postgresManager.run(convertedSql, params)
      return {
        id: result.id,
        affectedRows: result.affectedRows,
        changes: result.affectedRows
      }
    } else {
      const result = await dbManager.run(sql, params)
      return {
        id: result.id,
        affectedRows: result.changes,
        changes: result.changes
      }
    }
  }

  async close(): Promise<void> {
    if (this.usePostgres) {
      await postgresManager.close()
    } else {
      await dbManager.close()
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.usePostgres) {
        return await postgresManager.healthCheck()
      } else {
        await dbManager.get('SELECT 1')
        return true
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  // Get database type for debugging/logging
  getDatabaseType(): 'postgres' | 'sqlite' {
    return this.usePostgres ? 'postgres' : 'sqlite'
  }

  // Get connection info
  getConnectionInfo() {
    if (this.usePostgres) {
      return {
        type: 'postgres',
        ...postgresManager.getConnectionInfo()
      }
    } else {
      return {
        type: 'sqlite',
        connected: true
      }
    }
  }
}

// Export singleton instance
export const universalDb = new UniversalDatabaseAdapter()
export default universalDb