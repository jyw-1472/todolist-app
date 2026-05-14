'use strict';

const { pool } = require('../config/database');

/**
 * @typedef {Object} Category
 * @property {number} category_id
 * @property {number|null} user_id
 * @property {string} name
 * @property {boolean} is_default
 */

/**
 * 사용자의 모든 카테고리를 조회한다 (기본 카테고리 + 사용자 정의 카테고리).
 * @param {number} userId
 * @returns {Promise<Category[]>}
 */
async function findAllByUser(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM categories
     WHERE user_id = $1 OR user_id IS NULL
     ORDER BY category_id ASC`,
    [userId]
  );
  return rows;
}

/**
 * ID로 카테고리를 조회한다.
 * @param {number} categoryId
 * @returns {Promise<Category|null>}
 */
async function findById(categoryId) {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE category_id = $1',
    [categoryId]
  );
  return rows[0] ?? null;
}

/**
 * 카테고리를 생성한다.
 * @param {{ user_id: number, name: string }} input
 * @returns {Promise<Category>}
 */
async function create(input) {
  const { user_id, name } = input;
  const { rows } = await pool.query(
    `INSERT INTO categories (user_id, name)
     VALUES ($1, $2)
     RETURNING *`,
    [user_id, name]
  );
  return rows[0];
}

/**
 * 카테고리를 삭제한다.
 * @param {number} categoryId
 * @returns {Promise<void>}
 */
async function removeById(categoryId) {
  await pool.query('DELETE FROM categories WHERE category_id = $1', [categoryId]);
}

/**
 * 카테고리에 할일이 1건 이상 존재하는지 확인한다.
 * @param {number} categoryId
 * @returns {Promise<boolean>}
 */
async function hasTodos(categoryId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS cnt FROM todos WHERE category_id = $1',
    [categoryId]
  );
  return parseInt(rows[0].cnt, 10) > 0;
}

/**
 * 동일 사용자 범위 내 카테고리 이름 중복 여부를 확인한다.
 * @param {string} name
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
async function existsByNameForUser(name, userId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM categories WHERE name = $1 AND user_id = $2',
    [name, userId]
  );
  return rows.length > 0;
}

module.exports = { findAllByUser, findById, create, removeById, hasTodos, existsByNameForUser };
