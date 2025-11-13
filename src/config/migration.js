const { getPool } = require('./database');

class Migration {
  constructor() {
    this.pool = getPool();
  }

  async runMigrations() {
    try {
      console.log('Running database migrations...');

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Run all pending migrations
      await this.runPendingMigrations();

      console.log('All migrations completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async createMigrationsTable() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async runPendingMigrations() {
    const migrations = [
      {
        name: '001_add_firebase_fields',
        up: `
          -- Create users table if it doesn't exist
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

          -- Add indexes for performance
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
          CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
        `,
        down: `
          -- Remove Firebase-related columns (optional - dangerous in production)
          -- ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid;
          -- ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
          -- ALTER TABLE users DROP COLUMN IF EXISTS firebase_metadata;
          -- ALTER TABLE users DROP COLUMN IF EXISTS photo_url;

          -- Drop indexes
          DROP INDEX IF EXISTS idx_users_firebase_uid;
          DROP INDEX IF EXISTS idx_users_auth_provider;
        `
      }
    ];

    for (const migration of migrations) {
      const exists = await this.migrationExists(migration.name);

      if (!exists) {
        console.log(`Running migration: ${migration.name}`);
        await this.pool.query(migration.up);
        await this.markMigrationAsExecuted(migration.name);
        console.log(`Migration ${migration.name} completed successfully!`);
      } else {
        console.log(`Migration ${migration.name} already executed, skipping...`);
      }
    }
  }

  async migrationExists(name) {
    const result = await this.pool.query(
      'SELECT name FROM migrations WHERE name = $1',
      [name]
    );
    return result.rows.length > 0;
  }

  async markMigrationAsExecuted(name) {
    await this.pool.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [name]
    );
  }

  async rollback(migrationName) {
    const migrations = {
      '001_add_firebase_fields': `
        DROP INDEX IF EXISTS idx_users_firebase_uid;
        DROP INDEX IF EXISTS idx_users_auth_provider;
      `
    };

    if (migrations[migrationName]) {
      console.log(`Rolling back migration: ${migrationName}`);
      await this.pool.query(migrations[migrationName]);
      await this.pool.query(
        'DELETE FROM migrations WHERE name = $1',
        [migrationName]
      );
      console.log(`Rollback completed for: ${migrationName}`);
    } else {
      throw new Error(`Migration ${migrationName} not found for rollback`);
    }
  }

  async migrationStatus() {
    const result = await this.pool.query(
      'SELECT name, executed_at FROM migrations ORDER BY executed_at'
    );

    console.log('Migration Status:');
    if (result.rows.length === 0) {
      console.log('No migrations have been executed yet.');
    } else {
      result.rows.forEach(row => {
        console.log(`✓ ${row.name} - ${row.executed_at}`);
      });
    }
  }
}

module.exports = Migration;