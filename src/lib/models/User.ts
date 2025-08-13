import bcrypt from 'bcryptjs'
import universalDb from '../db/universal'
import type { User as UserType } from '../../types'

export class User implements UserType {
    id!: number
    username!: string
    email!: string
    role!: 'admin' | 'user'
    is_active!: boolean
    email_verified!: boolean
    email_verification_token?: string
    email_verification_expires?: string
    password_reset_token?: string
    password_reset_expires?: string
    created_at!: string
    last_login?: string
    stripe_customer_id?: string

    constructor(data: any) {
        Object.assign(this, data)
    }

    static async create(userData: {
        username: string
        email: string
        password: string
        role?: 'admin' | 'user'
        email_verified?: boolean
    }): Promise<User> {
        const hashedPassword = await bcrypt.hash(userData.password, 12)

        const emailVerified = userData.email_verified ?? false
        const result = await universalDb.run(
            universalDb.queryBuilder.buildQuery(`
                INSERT INTO users (username, email, password_hash, role, email_verified) 
                VALUES (?, ?, ?, ?, ?)
            `, true),
            [
                userData.username,
                userData.email,
                hashedPassword,
                userData.role || 'user',
                universalDb.queryBuilder.convertBoolean(emailVerified)
            ]
        )

        const user = await User.findById(result.id!)
        if (!user) {
            throw new Error('Failed to create user record')
        }
        return user
    }

    static async findById(id: number): Promise<User | null> {
        const row = await universalDb.get(universalDb.queryBuilder.buildQuery('SELECT * FROM users WHERE id = ?'), [id])
        return row ? new User(row) : null
    }

    static async findByUsername(username: string): Promise<User | null> {
        const row = await universalDb.get(universalDb.queryBuilder.buildQuery('SELECT * FROM users WHERE username = ?'), [username])
        return row ? new User(row) : null
    }

    static async findByEmail(email: string): Promise<User | null> {
        const row = await universalDb.get(universalDb.queryBuilder.buildQuery('SELECT * FROM users WHERE email = ?'), [email])
        return row ? new User(row) : null
    }

    static async findAll(limit = 100, offset = 0): Promise<User[]> {
        const isActiveValue = universalDb.queryBuilder.convertBoolean(true)
        const rows = await universalDb.all(universalDb.queryBuilder.buildQuery(`
            SELECT * FROM users 
            WHERE is_active = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `), [isActiveValue, limit, offset])
        
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
            await universalDb.run(
                universalDb.queryBuilder.buildQuery(`UPDATE users SET last_login = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE id = ?`),
                [user.id]
            )
        } catch (error) {
            console.log('Warning: Could not update last_login (database read-only)')
        }

        return user
    }

    async updatePassword(newPassword: string): Promise<boolean> {
        const hashedPassword = await bcrypt.hash(newPassword, 12)
        await universalDb.run(
            universalDb.queryBuilder.buildQuery('UPDATE users SET password_hash = ? WHERE id = ?'),
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

        await universalDb.run(
            universalDb.queryBuilder.buildQuery(`UPDATE users SET ${setClause}, updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE id = ?`),
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