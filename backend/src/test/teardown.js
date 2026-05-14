const { pool } = require('../config/database');

/**
 * 각 테스트 케이스 후 사용자 생성 데이터만 초기화한다 (시스템 기본 카테고리 유지).
 */
async function clearDatabase() {
  await pool.query('DELETE FROM todos');
  await pool.query('DELETE FROM categories WHERE user_id IS NOT NULL');
  await pool.query('DELETE FROM users');
}

module.exports = { clearDatabase };
