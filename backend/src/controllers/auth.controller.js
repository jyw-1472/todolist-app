'use strict';

const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

const signup = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, 'email, password, name은 필수입니다.');
  }
  const user = await authService.register(email, password, name);
  return sendSuccess(res, user, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, 'email, password는 필수입니다.');
  }
  const { accessToken, refreshToken, user } = await authService.login(email, password);
  return sendSuccess(res, { accessToken, refreshToken, user });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  authService.logout(refreshToken);
  return sendSuccess(res, null);
});

const refresh = asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const { code, statusCode } = ERROR_CODES.UNAUTHORIZED;
    throw new AppError(code, statusCode, '인증 토큰이 필요합니다.');
  }
  const refreshToken = authHeader.slice(7);
  const tokens = authService.refresh(refreshToken);
  return sendSuccess(res, tokens);
});

module.exports = { signup, login, logout, refresh };
