// import 'dotenv/config';
import * as pg from 'pg';

const { Client } = pg;

const databaseName = process.env.PGDATABASE || 'virus_ai';

async function setupDatabase(): Promise<void> {
  const client = new Client({
    // host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: 'postgres',
  });

  try {
    await client.connect();

    console.log(`🔍 Checking PostgreSQL database "${databaseName}"...`);

    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    if (result.rowCount === 0) {
      const safeDatabaseName = databaseName.replace(/"/g, '""');

      await client.query(`CREATE DATABASE "${safeDatabaseName}"`);

      console.log(`✅ Database "${databaseName}" created successfully.`);
    } else {
      console.log(`✅ Database "${databaseName}" already exists.`);
    }
  } catch (error) {
    console.error('❌ Failed to setup PostgreSQL database:', error);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

setupDatabase();
