'use strict';

const todoService = require('../services/todo.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * 쿼리 파라미터에서 필터를 파싱한다.
 * @param {object} query
 * @returns {import('../repositories/todo.repository').TodoFilter}
 */
function parseFilter(query) {
  const filter = {};
  if (query.category_id !== undefined) {
    const id = parseInt(query.category_id, 10);
    if (!isNaN(id)) filter.category_id = id;
  }
  if (query.from !== undefined) filter.from = query.from;
  if (query.to !== undefined) filter.to = query.to;
  if (query.is_completed !== undefined) {
    filter.is_completed = query.is_completed === 'true';
  }
  return filter;
}

const getTodos = asyncHandler(async (req, res) => {
  const filter = parseFilter(req.query);
  const todos = await todoService.getTodos(req.user.userId, filter);
  return sendSuccess(res, todos);
});

const getTodoById = asyncHandler(async (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  if (isNaN(todoId)) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, '유효하지 않은 할일 ID입니다.');
  }
  const todo = await todoService.getTodoById(req.user.userId, todoId);
  return sendSuccess(res, todo);
});

const createTodo = asyncHandler(async (req, res) => {
  const { category_id, title, description, start_date, due_date } = req.body;
  if (!title || category_id === undefined) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, 'title과 category_id는 필수입니다.');
  }
  const todo = await todoService.createTodo(req.user.userId, {
    category_id: parseInt(category_id, 10),
    title,
    description,
    start_date,
    due_date,
  });
  return sendSuccess(res, todo, 201);
});

const updateTodo = asyncHandler(async (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  if (isNaN(todoId)) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, '유효하지 않은 할일 ID입니다.');
  }
  const { title, description, start_date, due_date, category_id, is_completed } = req.body;
  const input = {};
  if (title !== undefined) input.title = title;
  if (description !== undefined) input.description = description;
  if (start_date !== undefined) input.start_date = start_date;
  if (due_date !== undefined) input.due_date = due_date;
  if (category_id !== undefined) input.category_id = parseInt(category_id, 10);
  if (is_completed !== undefined) input.is_completed = is_completed;

  const todo = await todoService.updateTodo(req.user.userId, todoId, input);
  return sendSuccess(res, todo);
});

const deleteTodo = asyncHandler(async (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  if (isNaN(todoId)) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, '유효하지 않은 할일 ID입니다.');
  }
  await todoService.deleteTodo(req.user.userId, todoId);
  return res.status(204).send();
});

const toggleComplete = asyncHandler(async (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  if (isNaN(todoId)) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, '유효하지 않은 할일 ID입니다.');
  }
  const todo = await todoService.toggleComplete(req.user.userId, todoId);
  return sendSuccess(res, todo);
});

module.exports = { getTodos, getTodoById, createTodo, updateTodo, deleteTodo, toggleComplete };
