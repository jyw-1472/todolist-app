'use strict';

const { pool } = require('../config/database');

/**
 * @typedef {Object} User
 * @property {number} user_id
 * @property {string} email
 * @property {string|null} password
 * @property {string} name
 * @property {string} provider
 * @property {string} created_at
 */

/**
 * 이메일로 사용자를 조회한다.
 * @param {string} email
 * @returns {Promise<User|null>}
 */
async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] ?? null;
}

/**
 * ID로 사용자를 조회한다.
 * @param {number} userId
 * @returns {Promise<User|null>}
 */
async function findById(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE user_id = $1',
    [userId]
  );
  return rows[0] ?? null;
}

/**
 * 새 사용자를 생성한다.
 * @param {{ email: string, password: string, name: string }} input
 * @returns {Promise<User>}
 */
async function create(input) {
  const { email, password, name } = input;
  const { rows } = await pool.query(
    `INSERT INTO users (email, password, name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, password, name]
  );
  return rows[0];
}

/**
 * 사용자 정보를 수정한다. 변경할 필드만 포함하면 된다.
 * @param {number} userId
 * @param {{ name?: string, password?: string }} input
 * @returns {Promise<User|null>}
 */
async function updateById(userId, input) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.password !== undefined) {
    fields.push(`password = $${idx++}`);
    values.push(input.password);
  }

  if (fields.length === 0) return findById(userId);

  values.push(userId);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

/**
 * 사용자를 삭제한다. CASCADE 로 연관 데이터(todos, categories)도 삭제된다.
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function removeById(userId) {
  await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
}

module.exports = { findByEmail, findById, create, updateById, removeById };
