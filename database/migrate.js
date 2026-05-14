// Usage: node database/migrate.js        → todolist_db
//        node database/migrate.js test   → todolist_test_db
const { Client } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');
require('dotenv').config({ path: join(__dirname, '../backend/.env') });

const isTest = process.argv[2] === 'test';
const dbName = isTest ? 'todolist_test_db' : (process.env.DB_NAME ?? 'todolist_db');

const client = new Client({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 5432),
  database: dbName,
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
});

async function migrate() {
  await client.connect();
  console.log(`[migrate] Connected to ${dbName}`);

  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await client.query(sql);

  console.log('[migrate] Schema applied successfully');
  await client.end();
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
