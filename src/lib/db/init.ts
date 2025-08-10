import dbManager from './index'

export async function initializeDatabase() {
    console.log('Initializing screenshot server database...')
    
    try {
        // Connect to database
        await dbManager.connect()
        
        // Run migrations
        await dbManager.runMigrations()
        
        console.log('Database initialized successfully')
        return true
    } catch (error) {
        console.error('Database initialization failed:', error)
        throw error
    }
}

export async function createDefaultAdmin() {
    const User = (await import('../models/User')).default
    
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findByUsername('admin')
        if (existingAdmin) {
            console.log('Admin user already exists')
            return existingAdmin
        }
        
        // Create default admin user
        const admin = await User.create({
            username: 'admin',
            email: 'admin@localhost',
            password: 'admin123',
            role: 'admin'
        })
        
        console.log('✅ Default admin user created')
        console.log('🔐 Username: admin')
        console.log('🔑 Password: admin123')
        
        return admin
    } catch (error) {
        console.error('Failed to create default admin:', error)
        throw error
    }
}

export async function closeDatabase() {
    try {
        await dbManager.close()
        console.log('Database connection closed')
    } catch (error) {
        console.error('Error closing database:', error)
    }
}