'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authenticate');
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleComplete,
} = require('../controllers/todo.controller');

const router = Router();

router.get('/',              authenticate, getTodos);
router.post('/',             authenticate, createTodo);
router.get('/:id',           authenticate, getTodoById);
router.patch('/:id',         authenticate, updateTodo);
router.delete('/:id',        authenticate, deleteTodo);
router.patch('/:id/complete', authenticate, toggleComplete);

module.exports = router;
