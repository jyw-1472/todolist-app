'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const { pool, connectDatabase } = require('../config/database');

describe('BE-05-1: pool 인스턴스 생성 및 export', () => {
  test('pool 이 export 된다', () => {
    expect(pool).toBeDefined();
  });

  test('pool 에 query 메서드가 존재한다 (pg Pool 인스턴스)', () => {
    expect(typeof pool.query).toBe('function');
  });

  test('pool 에 connect 메서드가 존재한다', () => {
    expect(typeof pool.connect).toBe('function');
  });

  test('pool 에 end 메서드가 존재한다', () => {
    expect(typeof pool.end).toBe('function');
  });

  test('두 번 require 해도 동일 인스턴스를 반환한다 (싱글톤)', () => {
    const { pool: pool2 } = require('../config/database');
    expect(pool).toBe(pool2);
  });
});

describe('BE-05-2: pool 설정값 검증', () => {
  test('connectionTimeoutMillis 가 2000 으로 설정되어 있다', () => {
    expect(pool.options.connectionTimeoutMillis).toBe(2000);
  });

  test('pool options 에 host 가 설정되어 있다', () => {
    expect(pool.options.host).toBeDefined();
  });

  test('pool options 에 database 가 설정되어 있다', () => {
    expect(pool.options.database).toBeDefined();
  });

  test('pool options 에 user 가 설정되어 있다', () => {
    expect(pool.options.user).toBeDefined();
  });

  test('pool options 의 max 가 1 이상이다', () => {
    expect(pool.options.max).toBeGreaterThanOrEqual(1);
  });

  test('pool options 의 idleTimeoutMillis 가 설정되어 있다', () => {
    expect(pool.options.idleTimeoutMillis).toBeDefined();
  });
});

describe('BE-05-3: connectDatabase 함수', () => {
  test('connectDatabase 가 export 된다', () => {
    expect(connectDatabase).toBeDefined();
    expect(typeof connectDatabase).toBe('function');
  });

  test('connectDatabase() 호출 시 정상 DB 연결에서 resolve 된다', async () => {
    await expect(connectDatabase()).resolves.not.toThrow();
  });
});

describe('BE-05-4: pool 로 실제 쿼리 실행', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('pool.query 로 SELECT 1 이 성공한다', async () => {
    const result = await pool.query('SELECT 1 AS val');
    expect(result.rows[0].val).toBe(1);
  });

  test('pool.connect 로 클라이언트를 획득하고 release 할 수 있다', async () => {
    const client = await pool.connect();
    expect(client).toBeDefined();
    expect(typeof client.query).toBe('function');
    client.release();
  });

  test('트랜잭션 BEGIN/COMMIT 이 정상 동작한다', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });
});

describe('BE-05-5: connectDatabase 실패 시 process.exit(1) 호출', () => {
  test('database.js 소스에 process.exit(1) 가 포함된다', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      path.join(__dirname, '../config/database.js'),
      'utf8'
    );
    expect(src).toMatch(/process\.exit\s*\(\s*1\s*\)/);
  });

  test('database.js 소스에 console.error 가 포함된다', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      path.join(__dirname, '../config/database.js'),
      'utf8'
    );
    expect(src).toMatch(/console\.error/);
  });
});
