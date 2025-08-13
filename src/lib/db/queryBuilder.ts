// Query builder to handle parameter differences between SQLite and PostgreSQL
export class QueryBuilder {
  private dbType: 'postgres' | 'sqlite'

  constructor(dbType: 'postgres' | 'sqlite') {
    this.dbType = dbType
  }

  // Convert SQL with ? placeholders to PostgreSQL $1, $2, etc.
  buildQuery(sql: string, addReturning: boolean = false): string {
    if (this.dbType === 'postgres') {
      let paramIndex = 1
      const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`)
      
      if (addReturning && convertedSql.toLowerCase().trim().startsWith('insert')) {
        return `${convertedSql} RETURNING id`
      }
      
      return convertedSql
    }
    
    return sql
  }

  // Convert boolean values for the database
  convertBoolean(value: boolean): boolean | number {
    if (this.dbType === 'postgres') {
      return value
    }
    return value ? 1 : 0
  }

  // Convert timestamp functions
  getCurrentTimestamp(): string {
    return this.dbType === 'postgres' ? 'CURRENT_TIMESTAMP' : "datetime('now')"
  }

  // Get NOW function for queries
  getNowFunction(): string {
    return this.dbType === 'postgres' ? 'NOW()' : "datetime('now')"
  }

  // Auto increment syntax
  getAutoIncrementType(): string {
    return this.dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'
  }

  // Boolean type
  getBooleanType(): string {
    return this.dbType === 'postgres' ? 'BOOLEAN' : 'INTEGER'
  }

  // Text type
  getTextType(size?: number): string {
    if (this.dbType === 'postgres') {
      return size ? `VARCHAR(${size})` : 'TEXT'
    }
    return 'TEXT'
  }

  // JSON type
  getJsonType(): string {
    return this.dbType === 'postgres' ? 'JSONB' : 'TEXT'
  }
}

// Export a function to create query builder based on current database type
export function createQueryBuilder(dbType: 'postgres' | 'sqlite'): QueryBuilder {
  return new QueryBuilder(dbType)
}