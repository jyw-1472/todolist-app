const { Pool, types } = require('pg');

// DATE(1082) 타입을 JS Date 객체가 아닌 문자열 그대로 반환
types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  host:                    process.env.DB_HOST,
  port:                    Number(process.env.DB_PORT ?? 5432),
  database:                process.env.DB_NAME,
  user:                    process.env.DB_USER,
  password:                process.env.DB_PASSWORD,
  max:                     Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis:       Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30000),
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

async function connectDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('[DB] Connected to PostgreSQL');
  } catch (err) {
    console.error('[DB] Connection failed:', err);
    process.exit(1);
  } finally {
    client?.release();
  }
}

module.exports = { pool, connectDatabase };
