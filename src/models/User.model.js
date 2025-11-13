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
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_email_verified BOOLEAN DEFAULT false,
        email_verification_token VARCHAR(255),
        email_verification_expire TIMESTAMP,
        reset_password_token VARCHAR(255),
        reset_password_expire TIMESTAMP,
        refresh_token VARCHAR(255),
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        firebase_uid VARCHAR(255) UNIQUE,
        auth_provider VARCHAR(20) DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'apple')),
        firebase_metadata JSONB,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
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
      `SELECT id, name, email, role, is_email_verified, last_login, is_active, firebase_uid, auth_provider, photo_url, created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );
    return result.rows;
  }

  // Create user with Firebase data
  static async createFirebaseUser({ firebase_uid, email, name, photo_url, auth_provider = 'email', firebase_metadata, role = 'user' }) {
    const pool = getPool();

    const result = await pool.query(
      `INSERT INTO users (firebase_uid, email, name, photo_url, auth_provider, firebase_metadata, role, is_email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, is_email_verified, last_login, is_active, firebase_uid, auth_provider, photo_url, created_at, updated_at`,
      [firebase_uid, email.toLowerCase().trim(), name, photo_url, auth_provider, firebase_metadata, role, true]
    );

    return result.rows[0];
  }

  // Find user by Firebase UID
  static async findByFirebaseUid(firebase_uid) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, email, role, is_email_verified, last_login, is_active, firebase_uid, auth_provider, photo_url, firebase_metadata, created_at, updated_at
       FROM users WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    return result.rows[0];
  }

  // Update Firebase user data
  static async updateFirebaseUser(id, updates) {
    const pool = getPool();
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(updates).forEach((key) => {
      if (key === 'firebase_metadata') {
        fields.push(`${key} = $${paramCount}::jsonb`);
      } else {
        fields.push(`${key} = $${paramCount}`);
      }
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
      RETURNING id, name, email, role, is_email_verified, last_login, is_active, firebase_uid, auth_provider, photo_url, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find or create Firebase user
  static async findOrCreateFirebaseUser(firebaseUser, auth_provider = 'email') {
    // First try to find by Firebase UID
    let user = await this.findByFirebaseUid(firebaseUser.uid);

    if (!user) {
      // Try to find by email (in case user exists but hasn't been linked to Firebase yet)
      user = await this.findByEmail(firebaseUser.email);

      if (user) {
        // Link existing user to Firebase
        user = await this.updateFirebaseUser(user.id, {
          firebase_uid: firebaseUser.uid,
          auth_provider: auth_provider,
          firebase_metadata: JSON.stringify(firebaseUser),
          photo_url: firebaseUser.photoURL || user.photo_url,
          is_email_verified: firebaseUser.emailVerified
        });
      } else {
        // Create new user
        user = await this.createFirebaseUser({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photo_url: firebaseUser.photoURL,
          auth_provider: auth_provider,
          firebase_metadata: JSON.stringify(firebaseUser)
        });
      }
    } else {
      // Update existing Firebase user with latest data
      user = await this.updateFirebaseUser(user.id, {
        firebase_metadata: JSON.stringify(firebaseUser),
        photo_url: firebaseUser.photoURL || user.photo_url,
        is_email_verified: firebaseUser.emailVerified
      });
    }

    return user;
  }
}

module.exports = User;
