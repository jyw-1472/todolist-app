'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('./error');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * Access Token 을 생성한다.
 * @param {{ userId: number, email: string }} payload
 * @returns {string} JWT Access Token (만료: 15분)
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
}

/**
 * Refresh Token 을 생성한다. jti 클레임으로 토큰 유일성을 보장한다.
 * @param {{ userId: number, email: string }} payload
 * @returns {string} JWT Refresh Token (만료: 7일)
 */
function generateRefreshToken(payload) {
  const { randomUUID } = require('crypto');
  return jwt.sign({ ...payload, jti: randomUUID() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

/**
 * JWT 토큰을 검증하고 페이로드를 반환한다.
 * @param {string} token
 * @returns {object} 디코딩된 페이로드
 * @throws {AppError} 만료·서명 오류 시 UNAUTHORIZED(401)
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    const { code, statusCode } = ERROR_CODES.UNAUTHORIZED;
    throw new AppError(code, statusCode, '유효하지 않거나 만료된 토큰입니다.');
  }
}

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
