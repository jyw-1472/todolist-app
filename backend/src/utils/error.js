'use strict';

class AppError extends Error {
  /**
   * @param {string} code - ERROR_CODES 의 코드 문자열
   * @param {number} statusCode - HTTP 상태 코드
   * @param {string} message - 사람이 읽을 수 있는 오류 메시지
   */
  constructor(code, statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

module.exports = { AppError };
