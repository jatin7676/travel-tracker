import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const sqlPath = path.resolve('./world.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('world.sql not found in project root.');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, { encoding: 'utf8' });
  // Split statements on semicolon followed by optional whitespace/newline. This is simple but should work for the provided SQL.
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  const Client = pg.Client;
  const clientConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      };

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected to DB, running migrations...');

    for (const stmt of statements) {
      try {
        if (stmt.length === 0) continue;
        // Some statements may lack a trailing semicolon after split; run as-is
        await client.query(stmt);
        console.log('OK:', stmt.split('\n')[0].slice(0, 100) + (stmt.length > 100 ? '...' : ''));
      } catch (err) {
        // Log and continue. Common errors: duplicate inserts or already-existing tables.
        console.warn('ERROR executing statement (continuing):', err.message.split('\n')[0]);
      }
    }

    console.log('Migrations finished.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
