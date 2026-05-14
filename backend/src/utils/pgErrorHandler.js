const { DatabaseError } = require('pg');

const PG_UNIQUE_VIOLATION      = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

/**
 * pg 에러를 앱 에러 객체로 변환한다.
 * @param {unknown} err
 * @returns {{ code: string, message: string, statusCode: number } | null}
 */
function mapPgError(err) {
  if (!(err instanceof DatabaseError)) return null;

  if (err.code === PG_UNIQUE_VIOLATION) {
    const isEmail = err.constraint?.includes('email');
    return isEmail
      ? { code: 'DUPLICATE_EMAIL',    message: '이미 사용 중인 이메일입니다.',        statusCode: 409 }
      : { code: 'DUPLICATE_CATEGORY', message: '이미 존재하는 카테고리 이름입니다.', statusCode: 409 };
  }

  if (err.code === PG_FOREIGN_KEY_VIOLATION) {
    return { code: 'RESOURCE_NOT_FOUND', message: '참조하는 리소스를 찾을 수 없습니다.', statusCode: 404 };
  }

  return null;
}

module.exports = { mapPgError };
