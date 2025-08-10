import bcrypt from 'bcryptjs'
import dbManager from '../db'
import type { User as UserType } from '../../types'

export class User implements UserType {
    id!: number
    username!: string
    email?: string
    role!: 'admin' | 'user'
    is_active!: boolean
    created_at!: string
    last_login?: string

    constructor(data: any) {
        Object.assign(this, data)
    }

    static async create(userData: {
        username: string
        email?: string
        password: string
        role?: 'admin' | 'user'
    }): Promise<User> {
        const hashedPassword = await bcrypt.hash(userData.password, 12)

        const result = await dbManager.run(`
            INSERT INTO users (username, email, password_hash, role) 
            VALUES (?, ?, ?, ?)
        `, [
            userData.username,
            userData.email,
            hashedPassword,
            userData.role || 'user'
        ])

        const user = await User.findById(result.id!)
        if (!user) {
            throw new Error('Failed to create user record')
        }
        return user
    }

    static async findById(id: number): Promise<User | null> {
        const row = await dbManager.get('SELECT * FROM users WHERE id = ?', [id])
        return row ? new User(row) : null
    }

    static async findByUsername(username: string): Promise<User | null> {
        const row = await dbManager.get('SELECT * FROM users WHERE username = ?', [username])
        return row ? new User(row) : null
    }

    static async findByEmail(email: string): Promise<User | null> {
        const row = await dbManager.get('SELECT * FROM users WHERE email = ?', [email])
        return row ? new User(row) : null
    }

    static async findAll(limit = 100, offset = 0): Promise<User[]> {
        const rows = await dbManager.all(`
            SELECT * FROM users 
            WHERE is_active = 1 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset])
        
        return rows.map(row => new User(row))
    }

    static async authenticate(username: string, password: string): Promise<User | null> {
        const user = await User.findByUsername(username)
        if (!user || !user.is_active) {
            return null
        }

        const isValid = await bcrypt.compare(password, (user as any).password_hash)
        if (!isValid) {
            return null
        }

        // Update last login (skip if database is read-only)
        try {
            await dbManager.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            )
        } catch (error) {
            console.log('Warning: Could not update last_login (database read-only)')
        }

        return user
    }

    async updatePassword(newPassword: string): Promise<boolean> {
        const hashedPassword = await bcrypt.hash(newPassword, 12)
        await dbManager.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, this.id]
        )
        return true
    }

    async update(updates: Partial<UserType>): Promise<void> {
        const fields = Object.keys(updates).filter(key => key !== 'id')
        if (fields.length === 0) return

        const setClause = fields.map(field => `${field} = ?`).join(', ')
        const values = fields.map(field => (updates as any)[field])
        values.push(this.id)

        await dbManager.run(
            `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        )

        Object.assign(this, updates)
    }

    async deactivate(): Promise<void> {
        await this.update({ is_active: false })
    }

    canManageUsers(): boolean {
        return this.role === 'admin'
    }

    canManageApiKeys(): boolean {
        return this.role === 'admin'
    }

    toJSON(): Omit<UserType, 'password_hash'> {
        const data = { ...this } as any
        delete data.password_hash // Never expose password hash
        return data
    }
}

export default User