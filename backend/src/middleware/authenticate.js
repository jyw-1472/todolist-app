'use strict';

const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * JWT Access Token 검증 미들웨어.
 * Authorization: Bearer <token> 헤더에서 토큰을 추출하고
 * 검증 후 req.user = { userId, email } 을 주입한다.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const { code, statusCode } = ERROR_CODES.UNAUTHORIZED;
    return next(new AppError(code, statusCode, '인증 토큰이 필요합니다.'));
  }

  const token = authHeader.slice(7); // 'Bearer ' 이후 토큰

  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { authenticate };
