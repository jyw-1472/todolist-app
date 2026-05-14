'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

// app.js 가 process.env.CORS_ORIGIN 을 읽으므로 먼저 설정
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const request = require('supertest');
const app = require('../app');

describe('BE-06-1: app.js 파일 존재 및 Express 인스턴스', () => {
  test('app.js 가 Express 앱 인스턴스를 export 한다', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function'); // Express app 은 함수
  });

  test('app 에 listen 메서드가 존재한다', () => {
    expect(typeof app.listen).toBe('function');
  });

  test('app 에 use 메서드가 존재한다', () => {
    expect(typeof app.use).toBe('function');
  });
});

describe('BE-06-2: express.json() 미들웨어', () => {
  test('JSON 요청 바디를 파싱한다', async () => {
    // POST 에 JSON 바디를 보내면 404 이지만 바디 파싱 오류 없이 응답한다
    const res = await request(app)
      .post('/api/test-json')
      .send({ key: 'value' })
      .set('Content-Type', 'application/json');
    // 경로가 없으므로 404, 하지만 파싱 오류(400)가 아니어야 함
    expect(res.status).not.toBe(400);
  });

  test('잘못된 JSON 바디 전송 시 400 을 반환한다', async () => {
    const res = await request(app)
      .post('/api/test-json')
      .send('{ invalid json }')
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });
});

describe('BE-06-3: CORS 미들웨어', () => {
  test('허용된 origin 으로 요청 시 CORS 헤더가 포함된다', async () => {
    const res = await request(app)
      .get('/any-path')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('CORS origin 이 * 와일드카드가 아니다', async () => {
    const res = await request(app)
      .get('/any-path')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });

  test('OPTIONS preflight 요청 시 200 을 반환한다', async () => {
    const res = await request(app)
      .options('/any-path')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(204);
  });

  test('app.js 소스에 credentials 가 없다 (PRD 명시)', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      path.join(__dirname, '../app.js'), 'utf8'
    );
    expect(src).not.toMatch(/credentials\s*:\s*true/);
  });
});

describe('BE-06-4: 404 핸들러', () => {
  test('존재하지 않는 경로 GET 요청 시 404 를 반환한다', async () => {
    const res = await request(app).get('/undefined-path');
    expect(res.status).toBe(404);
  });

  test('존재하지 않는 경로 POST 요청 시 404 를 반환한다', async () => {
    const res = await request(app).post('/no-such-route');
    expect(res.status).toBe(404);
  });

  test('404 응답 바디에 error.code 가 있다', async () => {
    const res = await request(app).get('/not-found');
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBeDefined();
  });

  test('404 응답 바디에 error.message 가 있다', async () => {
    const res = await request(app).get('/not-found');
    expect(res.body.error.message).toBeDefined();
  });
});

describe('BE-06-5: server.js 소스 검증', () => {
  const fs = require('fs');
  let src;
  beforeAll(() => {
    src = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  });

  test('server.js 파일이 존재한다', () => {
    expect(fs.existsSync(path.join(__dirname, '../server.js'))).toBe(true);
  });

  test('server.js 에 connectDatabase 호출이 있다', () => {
    expect(src).toMatch(/connectDatabase/);
  });

  test('server.js 에 app.listen 호출이 있다', () => {
    expect(src).toMatch(/app\.listen/);
  });

  test('server.js 에 "Server running on port" 메시지가 있다', () => {
    expect(src).toMatch(/Server running on port/);
  });

  test('server.js 에서 connectDatabase 가 listen 보다 먼저 호출된다', () => {
    const connectPos = src.indexOf('connectDatabase');
    const listenPos = src.indexOf('app.listen');
    expect(connectPos).toBeLessThan(listenPos);
  });
});
