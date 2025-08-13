import universalDb from './universal'

export async function initializeDatabase() {
    console.log('Initializing screenshot server database...')
    
    try {
        await universalDb.initialize()
        console.log(`✅ Database initialized (${universalDb.getDatabaseType()})`)
        
        // Create admin user if it doesn't exist
        await createDefaultAdmin()
        
        return true
    } catch (error) {
        console.error('Database initialization failed:', error)
        throw error
    }
}

export async function createDefaultAdmin() {
    const bcrypt = (await import('bcryptjs')).default
    
    try {
        // Check if admin user already exists
        const existingAdmin = await universalDb.get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            ['admin', 'admin@localhost']
        )
        
        if (existingAdmin) {
            console.log('Admin user already exists')
            return existingAdmin
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash('admin123', 12)
        
        // Create default admin user
        const result = await universalDb.run(`
            INSERT INTO users (
                username, 
                email, 
                password_hash, 
                role, 
                is_active,
                email_verified
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            'admin',
            'admin@localhost',
            passwordHash,
            'admin',
            universalDb.queryBuilder.convertBoolean(true),
            universalDb.queryBuilder.convertBoolean(true) // Admin is pre-verified
        ])
        
        console.log('✅ Default admin user created')
        console.log('🔐 Username: admin')
        console.log('🔑 Password: admin123')
        console.log('📧 Email: admin@localhost')
        
        return result
    } catch (error) {
        console.error('Failed to create default admin:', error)
        // Don't throw - this is optional
        console.warn('Continuing without default admin user')
    }
}

export async function closeDatabase() {
    try {
        await universalDb.close()
        console.log('Database connection closed')
    } catch (error) {
        console.error('Error closing database:', error)
    }
}