'use strict';

const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * async Controller 함수를 감싸 rejected Promise 를 next(err) 로 전달한다.
 * @param {Function} fn - async Express 핸들러
 * @returns {Function} Express 미들웨어
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Express 4-인자 에러 핸들러.
 * AppError → 표준 에러 응답, 그 외 → 500 INTERNAL_SERVER_ERROR.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    console.warn(`[ERROR] ${req.method} ${req.path} → ${err.statusCode} ${err.code}: ${err.message}`);
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Express 내장 에러 (JSON 파싱 실패 등) — err.status / err.statusCode 사용
  const httpStatus = err.status || err.statusCode;
  if (httpStatus && httpStatus < 500) {
    console.warn(`[ERROR] ${req.method} ${req.path} → ${httpStatus}: ${err.message}`);
    return res.status(httpStatus).json({
      error: { code: ERROR_CODES.VALIDATION_ERROR.code, message: err.message },
    });
  }

  // 예상치 못한 에러 — 스택 트레이스를 클라이언트에 노출하지 않는다
  console.error(`[ERROR] ${req.method} ${req.path} → 500 예상치 못한 오류:`, err);
  const { code, statusCode } = ERROR_CODES.INTERNAL_SERVER_ERROR;
  return res.status(statusCode).json({
    error: { code, message: '서버 내부 오류가 발생했습니다.' },
  });
}

module.exports = { errorHandler, asyncHandler };
