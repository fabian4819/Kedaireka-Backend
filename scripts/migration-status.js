#!/usr/bin/env node

require('dotenv').config();
const { connectDB } = require('../src/config/database');
const Migration = require('../src/config/migration');

async function main() {
  // Initialize database connection first
  await connectDB();
  const migration = new Migration();

  try {
    await migration.migrationStatus();
    process.exit(0);
  } catch (error) {
    console.error('Failed to check migration status:', error);
    process.exit(1);
  }
}

main();
