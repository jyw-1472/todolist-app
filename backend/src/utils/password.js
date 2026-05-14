'use strict';

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * 평문 비밀번호를 bcrypt 해시로 변환한다.
 * @param {string} plain - 평문 비밀번호
 * @returns {Promise<string>} bcrypt 해시
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * 평문 비밀번호와 bcrypt 해시를 비교한다.
 * @param {string} plain - 평문 비밀번호
 * @param {string} hashed - bcrypt 해시
 * @returns {Promise<boolean>} 일치 여부
 */
async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hashPassword, comparePassword, SALT_ROUNDS };
