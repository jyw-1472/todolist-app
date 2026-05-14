'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

const { authenticate } = require('../middleware/authenticate');
const { errorHandler } = require('../middleware/errorHandler');
const { generateAccessToken } = require('../utils/jwt');

// 테스트용 앱 생성 헬퍼
function makeApp() {
  const app = express();
  app.use(express.json());
  // 인증이 필요한 보호 라우트
  app.get('/protected', authenticate, (req, res) => {
    res.json({ data: { userId: req.user.userId, email: req.user.email } });
  });
  app.use(errorHandler);
  return app;
}

const app = makeApp();
const PAYLOAD = { userId: 42, email: 'user@example.com' };

describe('BE-08-1: Authorization 헤더 없는 요청', () => {
  test('헤더 없는 요청 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('Authorization 헤더가 빈 문자열인 경우 401 이 반환된다', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', '');
    expect(res.status).toBe(401);
  });

  test('"Bearer " 접두어 없이 토큰만 전송 시 401 이 반환된다', async () => {
    const token = generateAccessToken(PAYLOAD);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', token); // Bearer 없음
    expect(res.status).toBe(401);
  });

  test('"Token xxx" 형식 전송 시 401 이 반환된다', async () => {
    const token = generateAccessToken(PAYLOAD);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(401);
  });
});

describe('BE-08-2: 유효하지 않은 토큰', () => {
  test('만료된 토큰 전달 시 401 이 반환된다', async () => {
    const expiredToken = jwt.sign(PAYLOAD, process.env.JWT_SECRET, { expiresIn: '0s' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('잘못된 서명의 토큰 전달 시 401 이 반환된다', async () => {
    const fakeToken = jwt.sign(PAYLOAD, 'wrong_secret');
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });

  test('임의의 문자열 토큰 전달 시 401 이 반환된다', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer notavalidtoken');
    expect(res.status).toBe(401);
  });

  test('"Bearer " 뒤에 공백만 있을 경우 401 이 반환된다', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });
});

describe('BE-08-3: 유효한 토큰 — req.user 주입', () => {
  test('유효한 Access Token 전달 시 200 이 반환된다', async () => {
    const token = generateAccessToken(PAYLOAD);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('req.user.userId 가 토큰 페이로드와 일치한다', async () => {
    const token = generateAccessToken(PAYLOAD);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.userId).toBe(PAYLOAD.userId);
  });

  test('req.user.email 이 토큰 페이로드와 일치한다', async () => {
    const token = generateAccessToken(PAYLOAD);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.email).toBe(PAYLOAD.email);
  });

  test('다른 userId/email 페이로드도 올바르게 주입된다', async () => {
    const otherPayload = { userId: 99, email: 'other@example.com' };
    const token = generateAccessToken(otherPayload);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.userId).toBe(99);
    expect(res.body.data.email).toBe('other@example.com');
  });
});

describe('BE-08-4: DB 조회 없음 검증 (소스 분석)', () => {
  const fs = require('fs');
  let src;
  beforeAll(() => {
    src = fs.readFileSync(
      path.join(__dirname, '../middleware/authenticate.js'), 'utf8'
    );
  });

  test('authenticate.js 에 pool.query 호출이 없다', () => {
    expect(src).not.toMatch(/pool\.query/);
  });

  test('authenticate.js 에 require.*database 가 없다', () => {
    expect(src).not.toMatch(/require.*database/);
  });

  test('authenticate.js 에 verifyToken 을 사용한다', () => {
    expect(src).toMatch(/verifyToken/);
  });

  test('authenticate.js 에 req.user 를 설정한다', () => {
    expect(src).toMatch(/req\.user/);
  });
});
