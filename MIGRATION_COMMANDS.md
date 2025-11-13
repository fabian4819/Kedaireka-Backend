# Database Migration Commands

## Quick Reference

### Run Migrations
```bash
# Run all pending migrations
npm run migrate

# Alternative: node scripts/migrate.js
```

### Check Status
```bash
# See which migrations have been executed
npm run migrate:status

# Alternative: node scripts/migration-status.js
```

### Rollback
```bash
# Rollback a specific migration
npm run migrate:rollback 001_add_firebase_fields

# Alternative: node scripts/rollback.js 001_add_firebase_fields
```

## Available Migrations

### `001_add_firebase_fields`
**Description**: Adds Firebase authentication fields to the users table

**Changes**:
- Adds `firebase_uid VARCHAR(255) UNIQUE` - Links to Firebase user ID
- Adds `auth_provider VARCHAR(20)` - Tracks auth method (email, google, apple)
- Adds `firebase_metadata JSONB` - Stores Firebase user data
- Adds `photo_url TEXT` - User profile picture URL
- Makes `password` column nullable (Firebase users don't need passwords)
- Adds indexes for `firebase_uid` and `auth_provider`

## Migration Files Structure

```
src/config/migration.js     - Migration engine
scripts/migrate.js          - Run migrations script
scripts/migration-status.js - Check migration status
scripts/rollback.js         - Rollback specific migration
```

## Adding New Migrations

1. Add migration object to `src/config/migration.js` in the `migrations` array:

```javascript
{
  name: '002_your_migration_name',
  up: `
    -- Your SQL commands here
    ALTER TABLE users ADD COLUMN new_field VARCHAR(100);
  `,
  down: `
    -- Rollback SQL commands here
    ALTER TABLE users DROP COLUMN new_field;
  `
}
```

2. Run with `npm run migrate`

## Best Practices

1. **Always test migrations on development first**
2. **Keep migrations reversible** - Always provide `down` script
3. **Use descriptive names** - Like `001_add_firebase_fields`
4. **Backup database** before running migrations in production
5. **Check status** before and after running migrations
6. **Handle data carefully** - Migrations should preserve existing data

## Troubleshooting

### Migration Failed
```bash
# Check what went wrong
npm run migrate:status

# If partially applied, rollback and try again
npm run migrate:rollback [migration_name]
npm run migrate
```

### Migration Stuck
1. Check database connection
2. Verify SQL syntax
3. Look at server logs for detailed error messages

### Rollback Issues
- Ensure you have the correct migration name
- Some operations (like column deletion) might need manual intervention
- Always backup before rolling back in production