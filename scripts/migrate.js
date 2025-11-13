#!/usr/bin/env node

require('dotenv').config();
const { connectDB } = require('../src/config/database');
const Migration = require('../src/config/migration');

async function main() {
  // Initialize database connection first
  await connectDB();
  const migration = new Migration();

  try {
    await migration.runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
