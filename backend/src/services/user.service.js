'use strict';

const { findById, updateById, removeById } = require('../repositories/user.repository');
const { comparePassword, hashPassword } = require('../utils/password');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * 내 정보 조회 (비밀번호 필드 제외)
 * @param {number} userId
 * @returns {Promise<{ user_id: number, email: string, name: string, provider: string, created_at: string }>}
 */
async function getMe(userId) {
  console.log(`[USER] 내 정보 조회: userId=${userId}`);
  const user = await findById(userId);
  if (!user) {
    const { code, statusCode } = ERROR_CODES.RESOURCE_NOT_FOUND;
    throw new AppError(code, statusCode, '사용자를 찾을 수 없습니다.');
  }
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

/**
 * 내 정보 수정 (이름·비밀번호 변경 가능)
 * @param {number} userId
 * @param {{ name?: string, currentPassword?: string, newPassword?: string }} input
 * @returns {Promise<{ user_id: number, email: string, name: string, provider: string, created_at: string }>}
 */
async function updateMe(userId, input) {
  const { name, currentPassword, newPassword } = input;
  console.log(`[USER] 내 정보 수정 시도: userId=${userId}, fields=${Object.keys(input).filter((k) => input[k] !== undefined).join(',')}`);

  const user = await findById(userId);
  if (!user) {
    const { code, statusCode } = ERROR_CODES.RESOURCE_NOT_FOUND;
    throw new AppError(code, statusCode, '사용자를 찾을 수 없습니다.');
  }

  const updateInput = {};

  if (name !== undefined) {
    updateInput.name = name;
  }

  if (newPassword !== undefined) {
    if (!currentPassword) {
      const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
      throw new AppError(code, statusCode, '비밀번호 변경 시 현재 비밀번호가 필요합니다.');
    }
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      const { code, statusCode } = ERROR_CODES.UNAUTHORIZED;
      throw new AppError(code, statusCode, '현재 비밀번호가 올바르지 않습니다.');
    }
    updateInput.password = await hashPassword(newPassword);
  }

  if (Object.keys(updateInput).length === 0) {
    const { password: _pw, ...safeUser } = user;
    return safeUser;
  }

  const updated = await updateById(userId, updateInput);
  console.log(`[USER] 내 정보 수정 완료: userId=${userId}`);
  const { password: _pw, ...safeUser } = updated;
  return safeUser;
}

/**
 * 회원 탈퇴 — 비밀번호 검증 후 사용자 삭제 (CASCADE)
 * @param {number} userId
 * @param {string} password - 본인 확인용 현재 비밀번호
 * @returns {Promise<void>}
 */
async function deleteMe(userId, password) {
  console.log(`[USER] 회원 탈퇴 시도: userId=${userId}`);
  const user = await findById(userId);
  if (!user) {
    const { code, statusCode } = ERROR_CODES.RESOURCE_NOT_FOUND;
    throw new AppError(code, statusCode, '사용자를 찾을 수 없습니다.');
  }

  if (!password) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, '비밀번호 확인이 필요합니다.');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const { code, statusCode } = ERROR_CODES.UNAUTHORIZED;
    throw new AppError(code, statusCode, '비밀번호가 올바르지 않습니다.');
  }

  await removeById(userId);
  console.log(`[USER] 회원 탈퇴 완료: userId=${userId}, email=${user.email}`);
}

module.exports = { getMe, updateMe, deleteMe };
