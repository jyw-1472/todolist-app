'use strict';

const { findByEmail, create } = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

// 무효화된 Refresh Token 블랙리스트 (인메모리)
const revokedTokens = new Set();

/**
 * 회원가입
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @returns {Promise<{ user_id: number, email: string, name: string, provider: string, created_at: string }>}
 */
async function register(email, password, name) {
  console.log(`[AUTH] 회원가입 시도: ${email}`);
  const existing = await findByEmail(email);
  if (existing) {
    const { code, statusCode } = ERROR_CODES.DUPLICATE_EMAIL;
    throw new AppError(code, statusCode, '이미 사용 중인 이메일입니다.');
  }

  const hashedPassword = await hashPassword(password);
  const user = await create({ email, password: hashedPassword, name });
  console.log(`[AUTH] 회원가입 완료: userId=${user.user_id}, email=${email}`);

  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

/**
 * 로그인
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
async function login(email, password) {
  console.log(`[AUTH] 로그인 시도: ${email}`);
  const user = await findByEmail(email);
  if (!user) {
    console.warn(`[AUTH] 로그인 실패 — 존재하지 않는 이메일: ${email}`);
    const { code, statusCode } = ERROR_CODES.UNAUTHORIZED;
    throw new AppError(code, statusCode, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    console.warn(`[AUTH] 로그인 실패 — 비밀번호 불일치: userId=${user.user_id}`);
    const { code, statusCode } = ERROR_CODES.UNAUTHORIZED;
    throw new AppError(code, statusCode, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const payload = { userId: user.user_id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  console.log(`[AUTH] 로그인 성공: userId=${user.user_id}, email=${email}`);

  const { password: _pw, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

/**
 * 로그아웃 — Refresh Token 무효화
 * @param {string} refreshToken
 * @returns {void}
 */
function logout(refreshToken) {
  if (refreshToken) {
    revokedTokens.add(refreshToken);
    console.log('[AUTH] 로그아웃 — Refresh Token 무효화 완료');
  }
}

/**
 * Refresh Token으로 새 토큰 쌍 발급
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
function refresh(refreshToken) {
  const payload = verifyToken(refreshToken); // 만료·서명 오류 시 AppError throw

  if (revokedTokens.has(refreshToken)) {
    console.warn(`[AUTH] 토큰 갱신 실패 — 이미 무효화된 토큰: userId=${payload.userId}`);
    const { code, statusCode } = ERROR_CODES.UNAUTHORIZED;
    throw new AppError(code, statusCode, '무효화된 토큰입니다.');
  }

  // 토큰 로테이션: 기존 토큰 무효화
  revokedTokens.add(refreshToken);

  const newPayload = { userId: payload.userId, email: payload.email };
  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);
  console.log(`[AUTH] 토큰 갱신 완료: userId=${payload.userId}`);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * 테스트 전용: 블랙리스트 초기화
 */
function _clearRevokedTokens() {
  revokedTokens.clear();
}

module.exports = { register, login, logout, refresh, _clearRevokedTokens };
