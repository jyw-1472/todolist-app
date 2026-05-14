'use strict';

// dotenv 가 .env 파일을 실제로 읽지 않도록 모킹 — process.env 조작이 덮어쓰이는 것을 방지
jest.mock('dotenv', () => ({ config: jest.fn() }));

const path = require('path');
const fs = require('fs');

const BACKEND_ROOT = path.join(__dirname, '..', '..');
const ENV_JS_PATH = path.join(BACKEND_ROOT, 'src', 'config', 'env.js');
const ENV_EXAMPLE_PATH = path.join(BACKEND_ROOT, '.env.example');

const REQUIRED_VARS = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'CORS_ORIGIN',
];
const ALL_EXPECTED_KEYS = [
  'PORT', 'NODE_ENV', 'CORS_ORIGIN',
  'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_POOL_MAX', 'DB_IDLE_TIMEOUT_MS',
  'JWT_SECRET', 'JWT_ACCESS_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN',
];

// 각 테스트 suite 에서 env 를 require 하기 위한 헬퍼
function requireEnv() {
  let result;
  jest.isolateModules(() => {
    result = require('../config/env');
  });
  return result;
}

describe('BE-02-1: env.js 파일 존재 및 dotenv 호출', () => {
  test('env.js 파일이 존재한다', () => {
    expect(fs.existsSync(ENV_JS_PATH)).toBe(true);
  });

  test('env.js 소스에 dotenv 를 require 한다', () => {
    const src = fs.readFileSync(ENV_JS_PATH, 'utf8');
    expect(src).toMatch(/require\s*\(\s*['"]dotenv['"]\s*\)/);
  });

  test('env.js 소스에 dotenv.config() 를 호출한다', () => {
    const src = fs.readFileSync(ENV_JS_PATH, 'utf8');
    expect(src).toMatch(/\.config\s*\(/);
  });

  test('env.js 소스에 module.exports 가 있다 (CommonJS)', () => {
    const src = fs.readFileSync(ENV_JS_PATH, 'utf8');
    expect(src).toMatch(/module\.exports/);
  });
});

describe('BE-02-2: 시크릿 하드코딩 금지', () => {
  let src;
  beforeAll(() => { src = fs.readFileSync(ENV_JS_PATH, 'utf8'); });

  test('JWT_SECRET 값이 소스에 하드코딩되어 있지 않다', () => {
    expect(src).not.toMatch(/jwt.*secret\s*[:=]\s*['"][^'"]{8,}/i);
  });

  test('DB_PASSWORD 값이 소스에 하드코딩되어 있지 않다', () => {
    expect(src).not.toMatch(/password\s*[:=]\s*['"][^'"]{4,}/i);
  });

  test('process.env 를 통해 값을 읽는다', () => {
    expect(src).toMatch(/process\.env\./);
  });
});

describe('BE-02-3: 필수 환경변수 누락 시 process.exit(1) 호출', () => {
  let originalExit;
  const savedEnv = {};

  beforeEach(() => {
    jest.resetModules();
    originalExit = process.exit;
    process.exit = jest.fn();
    // 테스트 전 현재 값 저장 후 필수 변수 전체 제거
    REQUIRED_VARS.forEach((key) => {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    });
  });

  afterEach(() => {
    process.exit = originalExit;
    // 저장한 값 복원
    REQUIRED_VARS.forEach((key) => {
      if (savedEnv[key] !== undefined) process.env[key] = savedEnv[key];
      else delete process.env[key];
    });
    jest.resetModules();
  });

  test('DB_HOST 누락 시 process.exit(1) 가 호출된다', () => {
    REQUIRED_VARS.forEach((k) => { process.env[k] = 'dummy'; });
    delete process.env.DB_HOST;
    requireEnv();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('JWT_SECRET 누락 시 process.exit(1) 가 호출된다', () => {
    REQUIRED_VARS.forEach((k) => { process.env[k] = 'dummy'; });
    delete process.env.JWT_SECRET;
    requireEnv();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('DB_PASSWORD 누락 시 process.exit(1) 가 호출된다', () => {
    REQUIRED_VARS.forEach((k) => { process.env[k] = 'dummy'; });
    delete process.env.DB_PASSWORD;
    requireEnv();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('CORS_ORIGIN 누락 시 process.exit(1) 가 호출된다', () => {
    REQUIRED_VARS.forEach((k) => { process.env[k] = 'dummy'; });
    delete process.env.CORS_ORIGIN;
    requireEnv();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('모든 필수 변수 누락 시 process.exit(1) 가 호출된다', () => {
    // 모든 필수 변수가 이미 제거된 상태
    requireEnv();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

describe('BE-02-4: env 객체 구조 검증', () => {
  let env;
  const savedEnv = {};
  const testVars = {
    DB_HOST: 'localhost', DB_NAME: 'testdb', DB_USER: 'postgres',
    DB_PASSWORD: 'secret', JWT_SECRET: 'testsecret', CORS_ORIGIN: 'http://localhost:5173',
    PORT: '3000', NODE_ENV: 'test', DB_PORT: '5432', DB_POOL_MAX: '10',
    DB_IDLE_TIMEOUT_MS: '30000', JWT_ACCESS_EXPIRES_IN: '15m', JWT_REFRESH_EXPIRES_IN: '7d',
  };

  beforeAll(() => {
    jest.resetModules();
    Object.keys(testVars).forEach((k) => { savedEnv[k] = process.env[k]; process.env[k] = testVars[k]; });
    ({ env } = requireEnv());
  });

  afterAll(() => {
    Object.keys(testVars).forEach((k) => {
      if (savedEnv[k] !== undefined) process.env[k] = savedEnv[k];
      else delete process.env[k];
    });
    jest.resetModules();
  });

  test('env 객체가 export 된다', () => {
    expect(env).toBeDefined();
    expect(typeof env).toBe('object');
  });

  test('env.port 가 숫자 타입이다', () => {
    expect(typeof env.port).toBe('number');
    expect(env.port).toBe(3000);
  });

  test('env.nodeEnv 가 존재한다', () => {
    expect(env.nodeEnv).toBeDefined();
    expect(typeof env.nodeEnv).toBe('string');
  });

  test('env.db 객체가 7개 필드를 가진다', () => {
    expect(env.db).toBeDefined();
    expect(env.db.host).toBe('localhost');
    expect(typeof env.db.port).toBe('number');
    expect(env.db.name).toBe('testdb');
    expect(env.db.user).toBe('postgres');
    expect(env.db.password).toBe('secret');
    expect(typeof env.db.poolMax).toBe('number');
    expect(typeof env.db.idleTimeoutMs).toBe('number');
  });

  test('env.jwt 객체가 secret, accessExpiresIn, refreshExpiresIn 을 가진다', () => {
    expect(env.jwt).toBeDefined();
    expect(env.jwt.secret).toBe('testsecret');
    expect(env.jwt.accessExpiresIn).toBe('15m');
    expect(env.jwt.refreshExpiresIn).toBe('7d');
  });

  test('env.corsOrigin 이 존재한다', () => {
    expect(env.corsOrigin).toBe('http://localhost:5173');
  });
});

describe('BE-02-5: env 기본값 처리', () => {
  let env;
  const savedEnv = {};
  const required = {
    DB_HOST: 'localhost', DB_NAME: 'testdb',
    DB_USER: 'postgres', DB_PASSWORD: 'secret',
    JWT_SECRET: 'testsecret', CORS_ORIGIN: 'http://localhost:5173',
  };
  const toDelete = ['PORT', 'NODE_ENV', 'JWT_ACCESS_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN', 'DB_PORT', 'DB_POOL_MAX', 'DB_IDLE_TIMEOUT_MS'];

  beforeAll(() => {
    jest.resetModules();
    Object.keys(required).forEach((k) => { savedEnv[k] = process.env[k]; process.env[k] = required[k]; });
    toDelete.forEach((k) => { savedEnv[k] = process.env[k]; delete process.env[k]; });
    ({ env } = requireEnv());
  });

  afterAll(() => {
    [...Object.keys(required), ...toDelete].forEach((k) => {
      if (savedEnv[k] !== undefined) process.env[k] = savedEnv[k];
      else delete process.env[k];
    });
    jest.resetModules();
  });

  test('PORT 미설정 시 기본값 3000 이 사용된다', () => {
    expect(env.port).toBe(3000);
  });

  test('NODE_ENV 미설정 시 기본값 development 가 사용된다', () => {
    expect(env.nodeEnv).toBe('development');
  });

  test('JWT_ACCESS_EXPIRES_IN 미설정 시 기본값 15m 이 사용된다', () => {
    expect(env.jwt.accessExpiresIn).toBe('15m');
  });

  test('JWT_REFRESH_EXPIRES_IN 미설정 시 기본값 7d 가 사용된다', () => {
    expect(env.jwt.refreshExpiresIn).toBe('7d');
  });

  test('DB_PORT 미설정 시 기본값 5432 가 사용된다', () => {
    expect(env.db.port).toBe(5432);
  });
});

describe('BE-02-6: .env.example 파일 검증', () => {
  let exampleContent;
  beforeAll(() => {
    exampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
  });

  test('.env.example 파일이 존재한다', () => {
    expect(fs.existsSync(ENV_EXAMPLE_PATH)).toBe(true);
  });

  test('.env.example 이 비어 있지 않다', () => {
    expect(exampleContent.trim().length).toBeGreaterThan(0);
  });

  ALL_EXPECTED_KEYS.forEach((key) => {
    test(`.env.example 에 ${key} 키가 존재한다`, () => {
      const lines = exampleContent.split('\n').filter((l) => !l.trim().startsWith('#'));
      const hasKey = lines.some((l) => l.startsWith(key + '=') || l.startsWith(key + ' ='));
      expect(hasKey).toBe(true);
    });
  });
});
