'use strict';

const categoryRepo = require('../repositories/category.repository');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * 사용자의 카테고리 목록 조회 (기본 + 사용자 정의)
 * @param {number} userId
 * @returns {Promise<import('../repositories/category.repository').Category[]>}
 */
async function getCategories(userId) {
  console.log(`[CATEGORY] 카테고리 목록 조회: userId=${userId}`);
  return categoryRepo.findAllByUser(userId);
}

/**
 * 카테고리 생성
 * @param {number} userId
 * @param {string} name
 * @returns {Promise<import('../repositories/category.repository').Category>}
 */
async function createCategory(userId, name) {
  console.log(`[CATEGORY] 카테고리 생성 시도: userId=${userId}, name="${name}"`);
  const isDuplicate = await categoryRepo.existsByNameForUser(name, userId);
  if (isDuplicate) {
    const { code, statusCode } = ERROR_CODES.DUPLICATE_CATEGORY;
    throw new AppError(code, statusCode, '이미 사용 중인 카테고리 이름입니다.');
  }
  const category = await categoryRepo.create({ user_id: userId, name });
  console.log(`[CATEGORY] 카테고리 생성 완료: categoryId=${category.category_id}, name="${name}"`);
  return category;
}

/**
 * 카테고리 삭제
 * 검증 순서: 존재 여부(404) → is_default 체크(403) → 소유권(403) → 할일 존재(409) → 삭제
 * @param {number} categoryId
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function deleteCategory(categoryId, userId) {
  console.log(`[CATEGORY] 카테고리 삭제 시도: categoryId=${categoryId}, userId=${userId}`);
  const category = await categoryRepo.findById(categoryId);
  if (!category) {
    const { code, statusCode } = ERROR_CODES.RESOURCE_NOT_FOUND;
    throw new AppError(code, statusCode, '카테고리를 찾을 수 없습니다.');
  }

  if (category.is_default || category.user_id === null) {
    const { code, statusCode } = ERROR_CODES.DEFAULT_CATEGORY_IMMUTABLE;
    throw new AppError(code, statusCode, '기본 카테고리는 삭제할 수 없습니다.');
  }

  if (category.user_id !== userId) {
    const { code, statusCode } = ERROR_CODES.FORBIDDEN;
    throw new AppError(code, statusCode, '본인 소유의 카테고리만 삭제할 수 있습니다.');
  }

  const hasTodos = await categoryRepo.hasTodos(categoryId);
  if (hasTodos) {
    const { code, statusCode } = ERROR_CODES.CATEGORY_HAS_TODOS;
    throw new AppError(code, statusCode, '할일이 존재하는 카테고리는 삭제할 수 없습니다.');
  }

  await categoryRepo.removeById(categoryId);
  console.log(`[CATEGORY] 카테고리 삭제 완료: categoryId=${categoryId}`);
}

module.exports = { getCategories, createCategory, deleteCategory };
