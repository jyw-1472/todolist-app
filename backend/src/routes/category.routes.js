'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authenticate');
const { getCategories, createCategory, deleteCategory } = require('../controllers/category.controller');

const router = Router();

router.get('/',    authenticate, getCategories);
router.post('/',   authenticate, createCategory);
router.delete('/:id', authenticate, deleteCategory);

module.exports = router;
