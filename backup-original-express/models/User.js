const dbManager = require('../database/db-manager');
const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        Object.assign(this, data);
    }

    static async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        const result = await dbManager.run(`
            INSERT INTO users (username, email, password_hash, role) 
            VALUES (?, ?, ?, ?)
        `, [
            userData.username,
            userData.email,
            hashedPassword,
            userData.role || 'user'
        ]);

        return await User.findById(result.id);
    }

    static async findById(id) {
        const row = await dbManager.get('SELECT * FROM users WHERE id = ?', [id]);
        return row ? new User(row) : null;
    }

    static async findByUsername(username) {
        const row = await dbManager.get('SELECT * FROM users WHERE username = ?', [username]);
        return row ? new User(row) : null;
    }

    static async findByEmail(email) {
        const row = await dbManager.get('SELECT * FROM users WHERE email = ?', [email]);
        return row ? new User(row) : null;
    }

    static async findAll(limit = 100, offset = 0) {
        const rows = await dbManager.all(`
            SELECT * FROM users 
            WHERE is_active = 1 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        return rows.map(row => new User(row));
    }

    static async authenticate(username, password) {
        const user = await User.findByUsername(username);
        if (!user || !user.is_active) {
            return null;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return null;
        }

        // Update last login (skip if database is read-only)
        try {
            await dbManager.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );
        } catch (error) {
            console.log('Warning: Could not update last_login (database read-only)');
        }

        return user;
    }

    async updatePassword(newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await dbManager.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, this.id]
        );
        return true;
    }

    async update(updates) {
        const allowedFields = ['email', 'role', 'is_active'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(this.id);
        await dbManager.run(`
            UPDATE users SET ${fields.join(', ')} WHERE id = ?
        `, values);

        return true;
    }

    async delete() {
        await dbManager.run('UPDATE users SET is_active = 0 WHERE id = ?', [this.id]);
        return true;
    }

    async getApiKeys() {
        const ApiKey = require('./ApiKey');
        const rows = await dbManager.all(`
            SELECT * FROM api_keys 
            WHERE created_by = ? 
            ORDER BY created_at DESC
        `, [this.id]);
        
        return rows.map(row => new ApiKey(row));
    }

    isAdmin() {
        return this.role === 'admin';
    }

    canManageUsers() {
        return this.role === 'admin';
    }

    canManageApiKeys() {
        return this.role === 'admin';
    }

    toJSON() {
        const data = { ...this };
        delete data.password_hash; // Never expose password hash
        return data;
    }
}

module.exports = User;