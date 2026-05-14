const { Client } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');
require('dotenv').config({ path: join(__dirname, '../../.env.test') });

/**
 * Jest globalSetup — todolist_test_db에 스키마를 적용한다.
 */
async function globalSetup() {
  const client = new Client({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME     ?? 'todolist_test_db',
    user:     process.env.DB_USER     ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
  });

  await client.connect();

  const sql = readFileSync(join(__dirname, '../../../database/schema.sql'), 'utf-8');
  await client.query(sql);

  console.log('[test] Schema applied to todolist_test_db');
  await client.end();
}

module.exports = globalSetup;
