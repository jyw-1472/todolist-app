const { Client } = require('pg');
const { join } = require('path');
require('dotenv').config({ path: join(__dirname, '../backend/.env') });

const client = new Client({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME     ?? 'todolist_db',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
});

async function verify() {
  await client.connect();

  const { rows } = await client.query(
    'SELECT category_id, name, is_default FROM categories WHERE user_id IS NULL ORDER BY category_id'
  );

  const expected = ['전체', '업무', '개인', '쇼핑', '기타'];
  let passed = true;

  if (rows.length !== 5) {
    console.error(`[verify] FAIL: expected 5 seed rows, got ${rows.length}`);
    passed = false;
  }

  if (rows[0]?.is_default !== true) {
    console.error('[verify] FAIL: 전체 category is_default should be TRUE');
    passed = false;
  }

  expected.forEach((name, i) => {
    if (rows[i]?.name !== name) {
      console.error(`[verify] FAIL: row[${i}] name expected "${name}", got "${rows[i]?.name}"`);
      passed = false;
    }
  });

  if (passed) console.log('[verify] All seed data checks passed ✓');

  await client.end();
  if (!passed) process.exit(1);
}

verify().catch((err) => {
  console.error('[verify] Error:', err);
  process.exit(1);
});
