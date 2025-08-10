import sqlite3 from 'sqlite3'
import path from 'path'

export class DatabaseManager {
    private static instance: DatabaseManager
    private db: sqlite3.Database | null = null
    private dbPath: string

    private constructor() {
        this.dbPath = path.join(process.cwd(), 'database', 'screenshots.db')
    }

    static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager()
        }
        return DatabaseManager.instance
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Database connection error:', err.message)
                    reject(err)
                } else {
                    console.log('Connected to SQLite database')
                    resolve()
                }
            })
        })
    }

    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err)
                    } else {
                        console.log('Database connection closed')
                        this.db = null
                        resolve()
                    }
                })
            } else {
                resolve()
            }
        })
    }

    async run(sql: string, params: any[] = []): Promise<{ id?: number; changes: number }> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'))
                return
            }

            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err)
                } else {
                    resolve({ 
                        id: this.lastID,
                        changes: this.changes 
                    })
                }
            })
        })
    }

    async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'))
                return
            }

            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(row as T || null)
                }
            })
        })
    }

    async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'))
                return
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve((rows as T[]) || [])
                }
            })
        })
    }

    async runMigrations(): Promise<void> {
        console.log('Running database migrations...')
        
        // Users table
        await this.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )
        `)

        // API Keys table
        await this.run(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                key_hash TEXT NOT NULL,
                rate_limit INTEGER DEFAULT 1000,
                permissions TEXT DEFAULT '["screenshot"]',
                is_active INTEGER DEFAULT 1,
                created_by INTEGER,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        `)

        // Screenshots table
        await this.run(`
            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id INTEGER,
                url TEXT NOT NULL,
                image_path TEXT NOT NULL,
                file_name TEXT,
                format TEXT DEFAULT 'png',
                width INTEGER,
                height INTEGER,
                file_size INTEGER,
                success INTEGER DEFAULT 1,
                error_message TEXT,
                processing_time_ms INTEGER,
                request_id TEXT,
                capture_type TEXT DEFAULT 'screenshot',
                user_agent TEXT,
                ip_address TEXT,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
            )
        `)

        // Usage stats table
        await this.run(`
            CREATE TABLE IF NOT EXISTS usage_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id INTEGER,
                date DATE NOT NULL,
                request_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                total_processing_time_ms INTEGER DEFAULT 0,
                total_file_size INTEGER DEFAULT 0,
                avg_processing_time REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (api_key_id) REFERENCES api_keys (id),
                UNIQUE(api_key_id, date)
            )
        `)

        // Rate limits table
        await this.run(`
            CREATE TABLE IF NOT EXISTS rate_limits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id INTEGER,
                window_start DATETIME,
                request_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
            )
        `)

        // Create indexes
        await this.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_key_id ON api_keys (key_id)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys (created_by)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_screenshots_api_key_id ON screenshots (api_key_id)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_screenshots_created_at ON screenshots (created_at)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_screenshots_url ON screenshots (url)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_screenshots_request_id ON screenshots (request_id)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_usage_stats_api_key_date ON usage_stats (api_key_id, date)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_rate_limits_api_key_window ON rate_limits (api_key_id, window_start)`)
        
        // Billing indexes
        await this.run(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions (stripe_customer_id)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions (stripe_subscription_id)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_billing_cycles_user_period ON billing_cycles (user_id, billing_period_start)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_billing_cycles_subscription ON billing_cycles (subscription_id)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking (user_id, date)`)
        await this.run(`CREATE INDEX IF NOT EXISTS idx_usage_tracking_billing_cycle ON usage_tracking (billing_cycle_id)`)

        // Subscriptions table
        await this.run(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                stripe_customer_id TEXT,
                stripe_subscription_id TEXT,
                plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
                status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
                current_period_start DATETIME,
                current_period_end DATETIME,
                cancel_at_period_end INTEGER DEFAULT 0,
                trial_end DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(stripe_subscription_id)
            )
        `)

        // Billing cycles table
        await this.run(`
            CREATE TABLE IF NOT EXISTS billing_cycles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                subscription_id INTEGER NOT NULL,
                billing_period_start DATETIME NOT NULL,
                billing_period_end DATETIME NOT NULL,
                included_screenshots INTEGER NOT NULL DEFAULT 0,
                used_screenshots INTEGER NOT NULL DEFAULT 0,
                overage_screenshots INTEGER NOT NULL DEFAULT 0,
                base_amount INTEGER NOT NULL DEFAULT 0,
                overage_amount INTEGER NOT NULL DEFAULT 0,
                total_amount INTEGER NOT NULL DEFAULT 0,
                stripe_invoice_id TEXT,
                status TEXT DEFAULT 'open' CHECK (status IN ('open', 'paid', 'void', 'uncollectible')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (subscription_id) REFERENCES subscriptions (id),
                UNIQUE(user_id, billing_period_start)
            )
        `)

        // Usage tracking table
        await this.run(`
            CREATE TABLE IF NOT EXISTS usage_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                api_key_id INTEGER NOT NULL,
                billing_cycle_id INTEGER,
                screenshots_count INTEGER NOT NULL DEFAULT 1,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (api_key_id) REFERENCES api_keys (id),
                FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles (id)
            )
        `)

        // Add missing columns to existing tables (if they don't exist)
        await this.addMissingColumns()

        console.log('Database migrations completed successfully')
    }

    private async addMissingColumns(): Promise<void> {
        try {
            // Helper function to check if column exists
            const columnExists = async (table: string, column: string): Promise<boolean> => {
                try {
                    const result = await this.get(`PRAGMA table_info(${table})`)
                    const columns = await this.all(`PRAGMA table_info(${table})`)
                    return columns.some((col: any) => col.name === column)
                } catch {
                    return false
                }
            }

            // Add missing columns to users table
            if (!(await columnExists('users', 'stripe_customer_id'))) {
                await this.run(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`)
            }

            // Add missing columns to api_keys table
            if (!(await columnExists('api_keys', 'last_used'))) {
                await this.run(`ALTER TABLE api_keys ADD COLUMN last_used DATETIME`)
            }
            if (!(await columnExists('api_keys', 'subscription_id'))) {
                await this.run(`ALTER TABLE api_keys ADD COLUMN subscription_id INTEGER REFERENCES subscriptions(id)`)
            }

            // Add missing columns to screenshots table
            if (!(await columnExists('screenshots', 'file_name'))) {
                await this.run(`ALTER TABLE screenshots ADD COLUMN file_name TEXT`)
            }
            if (!(await columnExists('screenshots', 'file_size'))) {
                await this.run(`ALTER TABLE screenshots ADD COLUMN file_size INTEGER`)
            }
            if (!(await columnExists('screenshots', 'request_id'))) {
                await this.run(`ALTER TABLE screenshots ADD COLUMN request_id TEXT`)
            }
            if (!(await columnExists('screenshots', 'capture_type'))) {
                await this.run(`ALTER TABLE screenshots ADD COLUMN capture_type TEXT DEFAULT 'screenshot'`)
            }
            if (!(await columnExists('screenshots', 'user_agent'))) {
                await this.run(`ALTER TABLE screenshots ADD COLUMN user_agent TEXT`)
            }
            if (!(await columnExists('screenshots', 'ip_address'))) {
                await this.run(`ALTER TABLE screenshots ADD COLUMN ip_address TEXT`)
            }

            // Add missing columns to usage_stats table
            if (!(await columnExists('usage_stats', 'total_file_size'))) {
                await this.run(`ALTER TABLE usage_stats ADD COLUMN total_file_size INTEGER DEFAULT 0`)
            }
            if (!(await columnExists('usage_stats', 'avg_processing_time'))) {
                await this.run(`ALTER TABLE usage_stats ADD COLUMN avg_processing_time REAL DEFAULT 0`)
            }

        } catch (error) {
            console.warn('Warning: Some column additions may have failed:', error)
            // Don't throw - migrations should continue even if some columns can't be added
        }
    }
}

// Export singleton instance
const dbManager = DatabaseManager.getInstance()
export default dbManager