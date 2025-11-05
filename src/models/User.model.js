const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');

class User {
  // Create users table if not exists
  static async createTable() {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_email_verified BOOLEAN DEFAULT false,
        email_verification_token VARCHAR(255),
        email_verification_expire TIMESTAMP,
        reset_password_token VARCHAR(255),
        reset_password_expire TIMESTAMP,
        refresh_token VARCHAR(255),
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
  }

  // Create a new user
  static async create({ name, email, password, role = 'user' }) {
    const pool = getPool();

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_email_verified, last_login, is_active, created_at, updated_at`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, role]
    );

    return result.rows[0];
  }

  // Find user by email (with password)
  static async findByEmailWithPassword(email) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return result.rows[0];
  }

  // Find user by email (without password)
  static async findByEmail(email) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, email, role, is_email_verified, last_login, is_active, created_at, updated_at
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, email, role, is_email_verified, last_login, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Update user
  static async update(id, updates) {
    const pool = getPool();
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(updates).forEach((key) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    });

    // Add updated_at timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, is_email_verified, last_login, is_active, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const pool = getPool();
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
  }

  // Compare password
  static async matchPassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  // Delete user
  static async delete(id) {
    const pool = getPool();
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  // Find all users
  static async findAll() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, email, role, is_email_verified, last_login, is_active, created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );
    return result.rows;
  }
}

module.exports = User;
