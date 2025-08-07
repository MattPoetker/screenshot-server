const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'screenshots.db');
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.isConnected = true;
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        this.isConnected = false;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async runMigrations() {
        console.log('Running database migrations...');
        
        try {
            // Users table
            await this.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    is_active BOOLEAN DEFAULT 1
                )
            `);

            // API Keys table
            await this.run(`
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key_id VARCHAR(36) UNIQUE NOT NULL,
                    key_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME,
                    last_used DATETIME,
                    is_active BOOLEAN DEFAULT 1,
                    rate_limit INTEGER DEFAULT 1000,
                    permissions TEXT DEFAULT '[]',
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            `);

            // Screenshots table
            await this.run(`
                CREATE TABLE IF NOT EXISTS screenshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key_id INTEGER,
                    request_id VARCHAR(50),
                    url TEXT NOT NULL,
                    capture_type VARCHAR(20) DEFAULT 'screenshot',
                    file_path VARCHAR(255) NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_size INTEGER,
                    width INTEGER,
                    height INTEGER,
                    format VARCHAR(10),
                    processing_time INTEGER,
                    success BOOLEAN DEFAULT 1,
                    error_message TEXT,
                    user_agent TEXT,
                    ip_address VARCHAR(45),
                    metadata TEXT DEFAULT '{}',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
                )
            `);

            // Usage stats table
            await this.run(`
                CREATE TABLE IF NOT EXISTS usage_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key_id INTEGER,
                    date DATE NOT NULL,
                    request_count INTEGER DEFAULT 0,
                    success_count INTEGER DEFAULT 0,
                    error_count INTEGER DEFAULT 0,
                    total_file_size INTEGER DEFAULT 0,
                    avg_processing_time REAL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(api_key_id, date),
                    FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
                )
            `);

            // Rate limits table
            await this.run(`
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key_id INTEGER,
                    window_start DATETIME NOT NULL,
                    request_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
                )
            `);

            // Create indexes for better performance
            await this.run('CREATE INDEX IF NOT EXISTS idx_api_keys_key_id ON api_keys(key_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_screenshots_api_key_id ON screenshots(api_key_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_screenshots_created_at ON screenshots(created_at)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_screenshots_url ON screenshots(url)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_usage_stats_api_key_date ON usage_stats(api_key_id, date)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_rate_limits_api_key_window ON rate_limits(api_key_id, window_start)');

            console.log('Database migrations completed successfully');

            // Create default admin user if none exists
            await this.createDefaultAdmin();

        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    }

    async createDefaultAdmin() {
        const bcrypt = require('bcryptjs');
        
        const existingAdmin = await this.get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
        
        if (!existingAdmin) {
            const defaultPassword = 'admin123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 12);
            
            await this.run(`
                INSERT INTO users (username, email, password_hash, role) 
                VALUES (?, ?, ?, ?)
            `, ['admin', 'admin@example.com', hashedPassword, 'admin']);
            
            console.log('Created default admin user - Username: admin, Password: admin123');
            console.log('⚠️  IMPORTANT: Change the default password immediately!');
        }
    }

    async getStats() {
        const stats = {};
        
        stats.totalScreenshots = await this.get('SELECT COUNT(*) as count FROM screenshots');
        stats.totalApiKeys = await this.get('SELECT COUNT(*) as count FROM api_keys WHERE is_active = 1');
        stats.totalUsers = await this.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
        
        const today = new Date().toISOString().split('T')[0];
        stats.todayScreenshots = await this.get(
            'SELECT COUNT(*) as count FROM screenshots WHERE DATE(created_at) = ?', 
            [today]
        );
        
        return {
            totalScreenshots: stats.totalScreenshots?.count || 0,
            totalApiKeys: stats.totalApiKeys?.count || 0,
            totalUsers: stats.totalUsers?.count || 0,
            todayScreenshots: stats.todayScreenshots?.count || 0
        };
    }
}

// Export singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;