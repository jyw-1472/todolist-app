'use strict';

/**
 * 성공 응답을 전송한다. 응답 바디는 `{ "data": ... }` 구조를 따른다.
 * @param {import('express').Response} res
 * @param {*} data - 응답 데이터
 * @param {number} [statusCode=200] - HTTP 상태 코드
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ data });
}

module.exports = { sendSuccess };
