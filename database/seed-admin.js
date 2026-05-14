const { Client } = require('../backend/node_modules/pg');
const { join } = require('path');
const bcrypt = require('../backend/node_modules/bcrypt');
require('../backend/node_modules/dotenv').config({ path: join(__dirname, '../backend/.env') });

const ADMIN_EMAIL    = 'admin@todolist.com';
const ADMIN_PASSWORD = 'Admin1234!';
const ADMIN_NAME     = '관리자';

const client = new Client({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME     ?? 'todolist_db',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
});

async function seedAdmin() {
  await client.connect();

  const { rows: existing } = await client.query(
    'SELECT user_id FROM users WHERE email = $1',
    [ADMIN_EMAIL]
  );

  if (existing.length > 0) {
    console.log(`[seed-admin] 이미 존재하는 계정입니다 (user_id: ${existing[0].user_id})`);
    await client.end();
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const { rows } = await client.query(
    `INSERT INTO users (email, password, name, provider)
     VALUES ($1, $2, $3, 'local')
     RETURNING user_id, email, name`,
    [ADMIN_EMAIL, hashed, ADMIN_NAME]
  );

  console.log('[seed-admin] 관리자 계정 생성 완료');
  console.log(`  이메일  : ${ADMIN_EMAIL}`);
  console.log(`  비밀번호: ${ADMIN_PASSWORD}`);
  console.log(`  user_id : ${rows[0].user_id}`);

  await client.end();
}

seedAdmin().catch((err) => {
  console.error('[seed-admin] 오류:', err);
  process.exit(1);
});
