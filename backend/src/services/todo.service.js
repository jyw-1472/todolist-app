'use strict';

const todoRepo = require('../repositories/todo.repository');
const categoryRepo = require('../repositories/category.repository');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * 카테고리 존재 여부를 검증한다.
 * @param {number} categoryId
 */
async function validateCategoryExists(categoryId) {
  const category = await categoryRepo.findById(categoryId);
  if (!category) {
    const { code, statusCode } = ERROR_CODES.RESOURCE_NOT_FOUND;
    throw new AppError(code, statusCode, '카테고리를 찾을 수 없습니다.');
  }
  return category;
}

/**
 * 할일의 존재 여부와 소유권을 검증한다.
 * @param {number} todoId
 * @param {number} userId
 */
async function validateTodoOwnership(todoId, userId) {
  const todo = await todoRepo.findById(todoId);
  if (!todo) {
    const { code, statusCode } = ERROR_CODES.RESOURCE_NOT_FOUND;
    throw new AppError(code, statusCode, '할일을 찾을 수 없습니다.');
  }
  if (todo.user_id !== userId) {
    const { code, statusCode } = ERROR_CODES.FORBIDDEN;
    throw new AppError(code, statusCode, '본인 소유의 할일만 접근할 수 있습니다.');
  }
  return todo;
}

/**
 * 할일 목록 조회
 * @param {number} userId
 * @param {import('../repositories/todo.repository').TodoFilter} filter
 * @returns {Promise<import('../repositories/todo.repository').Todo[]>}
 */
async function getTodos(userId, filter = {}) {
  console.log(`[TODO] 할일 목록 조회: userId=${userId}, filter=${JSON.stringify(filter)}`);
  if (filter.category_id !== undefined) {
    await validateCategoryExists(filter.category_id);
  }
  return todoRepo.findAll(userId, filter);
}

/**
 * 할일 단건 조회
 * @param {number} userId
 * @param {number} todoId
 * @returns {Promise<import('../repositories/todo.repository').Todo>}
 */
async function getTodoById(userId, todoId) {
  return validateTodoOwnership(todoId, userId);
}

/**
 * 할일 생성
 * @param {number} userId
 * @param {{ category_id: number, title: string, description?: string, due_date?: string }} input
 * @returns {Promise<import('../repositories/todo.repository').Todo>}
 */
async function createTodo(userId, input) {
  console.log(`[TODO] 할일 생성 시도: userId=${userId}, categoryId=${input.category_id}, title="${input.title}"`);
  await validateCategoryExists(input.category_id);
  const todo = await todoRepo.create({ user_id: userId, ...input });
  console.log(`[TODO] 할일 생성 완료: todoId=${todo.todo_id}`);
  return todo;
}

/**
 * 할일 수정
 * @param {number} userId
 * @param {number} todoId
 * @param {{ title?: string, description?: string, due_date?: string, category_id?: number }} input
 * @returns {Promise<import('../repositories/todo.repository').Todo>}
 */
async function updateTodo(userId, todoId, input) {
  console.log(`[TODO] 할일 수정 시도: todoId=${todoId}, userId=${userId}`);
  await validateTodoOwnership(todoId, userId);
  if (input.category_id !== undefined) {
    await validateCategoryExists(input.category_id);
  }
  const todo = await todoRepo.updateById(todoId, input);
  console.log(`[TODO] 할일 수정 완료: todoId=${todoId}`);
  return todo;
}

/**
 * 할일 삭제
 * @param {number} userId
 * @param {number} todoId
 * @returns {Promise<void>}
 */
async function deleteTodo(userId, todoId) {
  console.log(`[TODO] 할일 삭제 시도: todoId=${todoId}, userId=${userId}`);
  await validateTodoOwnership(todoId, userId);
  await todoRepo.removeById(todoId);
  console.log(`[TODO] 할일 삭제 완료: todoId=${todoId}`);
}

/**
 * 할일 완료 상태 토글
 * @param {number} userId
 * @param {number} todoId
 * @returns {Promise<import('../repositories/todo.repository').Todo>}
 */
async function toggleComplete(userId, todoId) {
  console.log(`[TODO] 완료 상태 토글: todoId=${todoId}, userId=${userId}`);
  await validateTodoOwnership(todoId, userId);
  const todo = await todoRepo.toggleComplete(todoId);
  console.log(`[TODO] 완료 상태 토글 완료: todoId=${todoId}, is_completed=${todo.is_completed}`);
  return todo;
}

module.exports = { getTodos, getTodoById, createTodo, updateTodo, deleteTodo, toggleComplete };
