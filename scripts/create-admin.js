#!/usr/bin/env node

// Simple script to create an admin user
const bcrypt = require('bcryptjs')
const { universalDb } = require('../src/lib/db/universal')

async function createAdmin() {
  try {
    console.log('Initializing database...')
    await universalDb.initialize()
    
    const username = 'admin'
    const email = 'admin@localhost'
    const password = 'admin123'
    
    // Check if admin already exists
    const existingAdmin = await universalDb.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    )
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      return
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Create admin user
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
      username,
      email,
      passwordHash,
      'admin',
      universalDb.queryBuilder.convertBoolean(true),
      universalDb.queryBuilder.convertBoolean(true) // Admin is pre-verified
    ])
    
    console.log('✅ Admin user created successfully')
    console.log('🔐 Username: admin')
    console.log('🔑 Password: admin123')
    console.log('📧 Email: admin@localhost')
    console.log('🆔 User ID:', result.id)
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error)
  } finally {
    await universalDb.close()
  }
}

createAdmin()