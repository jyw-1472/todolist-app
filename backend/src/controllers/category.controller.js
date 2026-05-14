'use strict';

const categoryService = require('../services/category.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories(req.user.userId);
  return sendSuccess(res, categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, 'name은 필수입니다.');
  }
  const category = await categoryService.createCategory(req.user.userId, name);
  return sendSuccess(res, category, 201);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);
  if (isNaN(categoryId)) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, '유효하지 않은 카테고리 ID입니다.');
  }
  await categoryService.deleteCategory(categoryId, req.user.userId);
  return res.status(204).send();
});

module.exports = { getCategories, createCategory, deleteCategory };
