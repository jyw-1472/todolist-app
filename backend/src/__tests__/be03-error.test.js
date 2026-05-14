'use strict';

const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

const EXPECTED_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'RESOURCE_NOT_FOUND',
  'DUPLICATE_EMAIL',
  'DUPLICATE_CATEGORY',
  'CATEGORY_HAS_TODOS',
  'DEFAULT_CATEGORY_IMMUTABLE',
  'INTERNAL_SERVER_ERROR',
];

const EXPECTED_STATUS_MAP = {
  VALIDATION_ERROR:           400,
  UNAUTHORIZED:               401,
  FORBIDDEN:                  403,
  RESOURCE_NOT_FOUND:         404,
  DUPLICATE_EMAIL:            409,
  DUPLICATE_CATEGORY:         409,
  CATEGORY_HAS_TODOS:         409,
  DEFAULT_CATEGORY_IMMUTABLE: 403,
  INTERNAL_SERVER_ERROR:      500,
};

describe('BE-03-1: errorCodes.js — 9개 에러 코드 정의', () => {
  test('ERROR_CODES 가 export 된다', () => {
    expect(ERROR_CODES).toBeDefined();
    expect(typeof ERROR_CODES).toBe('object');
  });

  test('ERROR_CODES 에 정확히 9개 항목이 존재한다', () => {
    expect(Object.keys(ERROR_CODES)).toHaveLength(9);
  });

  EXPECTED_CODES.forEach((key) => {
    test(`ERROR_CODES.${key} 가 존재한다`, () => {
      expect(ERROR_CODES[key]).toBeDefined();
    });

    test(`ERROR_CODES.${key}.code 가 "${key}" 이다`, () => {
      expect(ERROR_CODES[key].code).toBe(key);
    });

    test(`ERROR_CODES.${key}.statusCode 가 ${EXPECTED_STATUS_MAP[key]} 이다`, () => {
      expect(ERROR_CODES[key].statusCode).toBe(EXPECTED_STATUS_MAP[key]);
    });
  });

  test('statusCode 필드가 모두 숫자 타입이다', () => {
    const invalid = Object.values(ERROR_CODES).filter((v) => typeof v.statusCode !== 'number');
    expect(invalid).toHaveLength(0);
  });
});

describe('BE-03-2: AppError 클래스 기본 동작', () => {
  test('AppError 를 new 로 생성할 수 있다', () => {
    const err = new AppError('RESOURCE_NOT_FOUND', 404, '리소스를 찾을 수 없습니다.');
    expect(err).toBeInstanceOf(AppError);
  });

  test('AppError 는 Error 의 인스턴스다', () => {
    const err = new AppError('UNAUTHORIZED', 401, '인증이 필요합니다.');
    expect(err).toBeInstanceOf(Error);
  });

  test('code 프로퍼티가 생성자 인자와 일치한다', () => {
    const err = new AppError('FORBIDDEN', 403, '접근 권한이 없습니다.');
    expect(err.code).toBe('FORBIDDEN');
  });

  test('statusCode 프로퍼티가 생성자 인자와 일치한다', () => {
    const err = new AppError('FORBIDDEN', 403, '접근 권한이 없습니다.');
    expect(err.statusCode).toBe(403);
  });

  test('message 프로퍼티가 생성자 인자와 일치한다', () => {
    const err = new AppError('RESOURCE_NOT_FOUND', 404, '리소스를 찾을 수 없습니다.');
    expect(err.message).toBe('리소스를 찾을 수 없습니다.');
  });

  test('stack 프로퍼티가 존재한다', () => {
    const err = new AppError('INTERNAL_SERVER_ERROR', 500, '서버 오류');
    expect(err.stack).toBeDefined();
  });

  test('name 이 "AppError" 이다', () => {
    const err = new AppError('VALIDATION_ERROR', 400, '유효성 오류');
    expect(err.name).toBe('AppError');
  });
});

describe('BE-03-3: throw/catch 정상 동작', () => {
  test('throw new AppError 가 catch 블록에서 잡힌다', () => {
    expect(() => {
      throw new AppError('RESOURCE_NOT_FOUND', 404, '없음');
    }).toThrow(AppError);
  });

  test('catch 된 AppError 에서 code 를 읽을 수 있다', () => {
    try {
      throw new AppError('DUPLICATE_EMAIL', 409, '이미 사용 중인 이메일');
    } catch (err) {
      expect(err.code).toBe('DUPLICATE_EMAIL');
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('이미 사용 중인 이메일');
    }
  });

  test('ERROR_CODES 상수를 이용한 throw 가 정상 동작한다', () => {
    const { code, statusCode } = ERROR_CODES.RESOURCE_NOT_FOUND;
    try {
      throw new AppError(code, statusCode, '요청한 리소스를 찾을 수 없습니다.');
    } catch (err) {
      expect(err.code).toBe('RESOURCE_NOT_FOUND');
      expect(err.statusCode).toBe(404);
    }
  });

  test('모든 에러 코드를 순회하며 AppError 생성이 가능하다', () => {
    EXPECTED_CODES.forEach((key) => {
      const { code, statusCode } = ERROR_CODES[key];
      const err = new AppError(code, statusCode, `${key} 오류`);
      expect(err.code).toBe(key);
      expect(err.statusCode).toBe(EXPECTED_STATUS_MAP[key]);
    });
  });
});

describe('BE-03-4: AppError 와 일반 Error 구분', () => {
  test('AppError 는 일반 Error 와 instanceof 로 구분된다', () => {
    const appErr = new AppError('FORBIDDEN', 403, '금지');
    const normalErr = new Error('일반 오류');
    expect(appErr instanceof AppError).toBe(true);
    expect(normalErr instanceof AppError).toBe(false);
  });

  test('일반 Error 에는 code, statusCode 프로퍼티가 없다', () => {
    const normalErr = new Error('일반 오류');
    expect(normalErr.code).toBeUndefined();
    expect(normalErr.statusCode).toBeUndefined();
  });
});
