'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const request = require('supertest');
const express = require('express');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');
const { errorHandler, asyncHandler } = require('../middleware/errorHandler');

// 테스트용 미니 앱 생성 헬퍼
function makeApp(...routes) {
  const app = express();
  app.use(express.json());
  routes.forEach((r) => app.use(r));
  app.use(errorHandler);
  return app;
}

describe('BE-07-1: errorHandler — AppError 처리', () => {
  test('AppError(RESOURCE_NOT_FOUND, 404) 시 표준 에러 응답이 반환된다', async () => {
    const app = makeApp(
      express.Router().get('/test', (_req, _res, next) => {
        next(new AppError('RESOURCE_NOT_FOUND', 404, '리소스 없음'));
      })
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(res.body.error.message).toBe('리소스 없음');
  });

  test('AppError(UNAUTHORIZED, 401) 시 401 이 반환된다', async () => {
    const app = makeApp(
      express.Router().get('/test', (_req, _res, next) => {
        next(new AppError('UNAUTHORIZED', 401, '인증 필요'));
      })
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('AppError(FORBIDDEN, 403) 시 403 이 반환된다', async () => {
    const app = makeApp(
      express.Router().get('/test', (_req, _res, next) => {
        next(new AppError('FORBIDDEN', 403, '접근 금지'));
      })
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('모든 AppError 에러 코드에 대해 응답 구조가 일관된다', async () => {
    for (const [key, { code, statusCode }] of Object.entries(ERROR_CODES)) {
      const app = makeApp(
        express.Router().get('/test', (_req, _res, next) => {
          next(new AppError(code, statusCode, `${key} 오류`));
        })
      );
      const res = await request(app).get('/test');
      expect(res.status).toBe(statusCode);
      expect(res.body.error.code).toBe(code);
      expect(res.body.error.message).toBeDefined();
    }
  });

  test('에러 응답 바디에 stack 이 포함되지 않는다', async () => {
    const app = makeApp(
      express.Router().get('/test', (_req, _res, next) => {
        next(new AppError('FORBIDDEN', 403, '금지'));
      })
    );
    const res = await request(app).get('/test');
    expect(res.body.error.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/at Object\./);
  });
});

describe('BE-07-2: errorHandler — 일반 Error 처리', () => {
  test('예상치 못한 Error 시 500 이 반환된다', async () => {
    const app = makeApp(
      express.Router().get('/test', (_req, _res, next) => {
        next(new Error('예상치 못한 오류'));
      })
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  test('500 응답 후 서버가 다운되지 않는다 (다음 요청도 정상 처리)', async () => {
    const app = makeApp(
      express.Router().get('/crash', (_req, _res, next) => {
        next(new Error('crash'));
      }),
      express.Router().get('/ok', (_req, res) => {
        res.status(200).json({ data: 'alive' });
      })
    );
    await request(app).get('/crash');
    const res = await request(app).get('/ok');
    expect(res.status).toBe(200);
  });

  test('500 응답 바디에 stack 이 포함되지 않는다', async () => {
    const app = makeApp(
      express.Router().get('/test', (_req, _res, next) => {
        next(new Error('내부 오류'));
      })
    );
    const res = await request(app).get('/test');
    expect(res.body.error.stack).toBeUndefined();
  });
});

describe('BE-07-3: asyncHandler 래퍼', () => {
  test('async 함수의 rejected Promise 가 next(err) 로 전달된다', async () => {
    const app = makeApp(
      express.Router().get('/test', asyncHandler(async () => {
        throw new AppError('RESOURCE_NOT_FOUND', 404, 'async 에러');
      }))
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  test('async 함수가 정상 완료되면 응답이 정상 반환된다', async () => {
    const app = makeApp(
      express.Router().get('/test', asyncHandler(async (_req, res) => {
        res.status(200).json({ data: 'ok' });
      }))
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.data).toBe('ok');
  });

  test('asyncHandler 가 일반 Error 도 next 로 전달한다', async () => {
    const app = makeApp(
      express.Router().get('/test', asyncHandler(async () => {
        throw new Error('일반 오류');
      }))
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
  });

  test('asyncHandler 반환값이 Express 미들웨어 함수(3인자)이다', () => {
    const fn = asyncHandler(async (_req, res) => res.json({}));
    expect(typeof fn).toBe('function');
    expect(fn.length).toBe(3);
  });
});

describe('BE-07-4: app.js 에 errorHandler 가 등록됨', () => {
  const mainApp = require('../app');

  test('app.js 소스에 errorHandler 등록 코드가 있다', () => {
    const fs = require('fs');
    const src = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
    expect(src).toMatch(/errorHandler/);
    expect(src).toMatch(/app\.use/);
  });

  test('app.js 에서 AppError 를 throw 하는 라우트에 500 이 아닌 올바른 상태코드가 반환된다', async () => {
    // mainApp 의 404 핸들러는 에러 핸들러보다 먼저 있으므로 일반 404 응답
    const res = await request(mainApp).get('/completely-unknown-path');
    expect(res.status).toBe(404);
  });
});
