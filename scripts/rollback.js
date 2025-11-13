#!/usr/bin/env node

require('dotenv').config();
const { connectDB } = require('../src/config/database');
const Migration = require('../src/config/migration');

async function main() {
  const migrationName = process.argv[2];

  if (!migrationName) {
    console.error('Please provide a migration name to rollback');
    console.log('Usage: node scripts/rollback.js <migration-name>');
    console.log('Example: node scripts/rollback.js 001_add_firebase_fields');
    process.exit(1);
  }

  // Initialize database connection first
  await connectDB();
  const migration = new Migration();

  try {
    await migration.rollback(migrationName);
    console.log('Rollback completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
}

main();
