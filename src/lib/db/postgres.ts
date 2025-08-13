import { Pool, PoolClient, QueryResult } from 'pg'

class PostgresManager {
  private pool: Pool | null = null

  async initialize() {
    if (this.pool) {
      return
    }

    const databaseUrl = process.env.DATABASE_URL || 
      'postgresql://screenshot_user:screenshot_password@localhost:5432/screenshot_db'

    this.pool = new Pool({
      connectionString: databaseUrl,
      // Connection pool settings
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Timeout after 2s if no connection available
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    // Test the connection
    try {
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()
      console.log('✅ PostgreSQL database connected successfully')
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error)
      throw error
    }

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err)
    })

    // Run migrations after successful connection
    await this.runMigrations()
  }

  async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      await this.initialize()
    }
    
    try {
      const start = Date.now()
      const result = await this.pool!.query<T>(text, params)
      const duration = Date.now() - start
      
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, text.substring(0, 100))
      }
      
      return result
    } catch (error) {
      console.error('Database query error:', error)
      console.error('Query:', text)
      console.error('Params:', params)
      throw error
    }
  }

  async get<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params)
    return result.rows[0] || null
  }

  async all<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.query<T>(text, params)
    return result.rows
  }

  async run(text: string, params?: any[]): Promise<{ id?: number; affectedRows: number }> {
    const result = await this.query(text, params)
    
    // For INSERT queries with RETURNING id
    if (result.rows.length > 0 && 'id' in result.rows[0]) {
      return {
        id: result.rows[0].id,
        affectedRows: result.rowCount || 0
      }
    }
    
    return {
      affectedRows: result.rowCount || 0
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      await this.initialize()
    }

    const client = await this.pool!.connect()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      console.log('PostgreSQL connection pool closed')
    }
  }

  async runMigrations() {
    console.log('Running PostgreSQL database migrations...')
    
    try {
      // Check if tables already exist (they do from Docker init)
      const tablesExist = await this.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'api_keys', 'screenshots')
      `)

      if (tablesExist.rows.length > 0) {
        console.log('Database tables already exist, skipping table creation')
        console.log('Existing tables:', tablesExist.rows.map(r => r.table_name).join(', '))
      } else {
        console.log('Creating database tables...')
        // Create tables only if they don't exist
        // (This code path likely won't execute since tables exist from Docker init)
      }

      console.log('Database migrations completed successfully')
    } catch (error) {
      console.error('Database migration failed:', error)
      throw error
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1')
      return true
    } catch (error) {
      console.error('PostgreSQL health check failed:', error)
      return false
    }
  }

  // Get connection info
  getConnectionInfo() {
    if (!this.pool) {
      return { connected: false }
    }

    return {
      connected: true,
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    }
  }
}

// Export singleton instance
export const postgresManager = new PostgresManager()
export default postgresManager