'use strict';

const { pool } = require('../config/database');

/**
 * @typedef {Object} Todo
 * @property {number} todo_id
 * @property {number} user_id
 * @property {number} category_id
 * @property {string} title
 * @property {string|null} description
 * @property {string|null} start_date
 * @property {string|null} due_date
 * @property {boolean} is_completed
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} TodoFilter
 * @property {number} [category_id]
 * @property {string} [from]  - YYYY-MM-DD
 * @property {string} [to]    - YYYY-MM-DD
 * @property {boolean} [is_completed]
 */

/**
 * 사용자의 할일 목록을 동적 필터로 조회한다.
 * 기본 정렬: due_date ASC NULLS LAST
 * @param {number} userId
 * @param {TodoFilter} [filter={}]
 * @returns {Promise<Todo[]>}
 */
async function findAll(userId, filter = {}) {
  const conditions = ['user_id = $1'];
  const values = [userId];
  let idx = 2;

  if (filter.category_id !== undefined) {
    conditions.push(`category_id = $${idx++}`);
    values.push(filter.category_id);
  }

  if (filter.from !== undefined) {
    conditions.push(`due_date >= $${idx++}`);
    values.push(filter.from);
  }

  if (filter.to !== undefined) {
    conditions.push(`due_date <= $${idx++}`);
    values.push(filter.to);
  }

  if (filter.is_completed !== undefined) {
    conditions.push(`is_completed = $${idx++}`);
    values.push(filter.is_completed);
  }

  const { rows } = await pool.query(
    `SELECT * FROM todos
     WHERE ${conditions.join(' AND ')}
     ORDER BY due_date ASC NULLS LAST`,
    values
  );
  return rows;
}

/**
 * ID로 할일을 조회한다.
 * @param {number} todoId
 * @returns {Promise<Todo|null>}
 */
async function findById(todoId) {
  const { rows } = await pool.query(
    'SELECT * FROM todos WHERE todo_id = $1',
    [todoId]
  );
  return rows[0] ?? null;
}

/**
 * 할일을 생성한다.
 * @param {{ user_id: number, category_id: number, title: string, description?: string, start_date?: string, due_date?: string }} input
 * @returns {Promise<Todo>}
 */
async function create(input) {
  const { user_id, category_id, title, description = null, start_date = null, due_date = null } = input;
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, description, start_date, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, category_id, title, description, start_date, due_date]
  );
  return rows[0];
}

/**
 * 할일을 수정한다. 변경할 필드만 포함하면 된다. updated_at은 자동 갱신된다.
 * @param {number} todoId
 * @param {{ title?: string, description?: string, start_date?: string, due_date?: string, category_id?: number, is_completed?: boolean }} input
 * @returns {Promise<Todo|null>}
 */
async function updateById(todoId, input) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(input.title);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(input.description);
  }
  if (input.start_date !== undefined) {
    fields.push(`start_date = $${idx++}`);
    values.push(input.start_date);
  }
  if (input.due_date !== undefined) {
    fields.push(`due_date = $${idx++}`);
    values.push(input.due_date);
  }
  if (input.category_id !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(input.category_id);
  }
  if (input.is_completed !== undefined) {
    fields.push(`is_completed = $${idx++}`);
    values.push(input.is_completed);
  }

  if (fields.length === 0) return findById(todoId);

  // updated_at은 트리거가 자동 갱신하지만 명시적으로도 설정한다
  fields.push(`updated_at = NOW()`);
  values.push(todoId);

  const { rows } = await pool.query(
    `UPDATE todos SET ${fields.join(', ')} WHERE todo_id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

/**
 * 할일을 삭제한다.
 * @param {number} todoId
 * @returns {Promise<void>}
 */
async function removeById(todoId) {
  await pool.query('DELETE FROM todos WHERE todo_id = $1', [todoId]);
}

/**
 * 할일의 완료 상태를 토글하고 updated_at을 갱신한다.
 * @param {number} todoId
 * @returns {Promise<Todo|null>}
 */
async function toggleComplete(todoId) {
  const { rows } = await pool.query(
    `UPDATE todos
     SET is_completed = NOT is_completed, updated_at = NOW()
     WHERE todo_id = $1
     RETURNING *`,
    [todoId]
  );
  return rows[0] ?? null;
}

module.exports = { findAll, findById, create, updateById, removeById, toggleComplete };
