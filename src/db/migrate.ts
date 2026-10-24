import { runner } from 'node-pg-migrate';
import { config } from '../config/env.js';

export const runMigrations = async (): Promise<void> => {
  console.log('🔄 Running database migrations via node-pg-migrate...');
  await runner({
    databaseUrl:
      process.env.DATABASE_URL ||
      `postgresql://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`,
    dir: 'migrations',
    direction: 'up',
    migrationsTable: 'pgmigrations',
    verbose: true,
  });
  console.log('✅ Migrations completed successfully.');
};

// If run directly via npm run db:migrate
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}
