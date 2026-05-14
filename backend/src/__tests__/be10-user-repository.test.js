'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const { pool } = require('../config/database');
const { clearDatabase } = require('../test/teardown');
const {
  findByEmail, findById, create, updateById, removeById,
} = require('../repositories/user.repository');

const TEST_USER = {
  email: 'repo@example.com',
  password: '$2b$10$hashedpassword',
  name: '테스트유저',
};

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await pool.end();
});

// ────────────────────────────────────────────────
describe('BE-10-1: create', () => {
  test('사용자를 생성하고 전체 정보를 반환한다 (RETURNING *)', async () => {
    const user = await create(TEST_USER);
    expect(user.user_id).toBeDefined();
    expect(user.email).toBe(TEST_USER.email);
    expect(user.name).toBe(TEST_USER.name);
    expect(user.password).toBe(TEST_USER.password);
    expect(user.provider).toBe('local');
    expect(user.created_at).toBeDefined();
  });

  test('생성된 user_id 가 숫자 타입이다', async () => {
    const user = await create(TEST_USER);
    expect(typeof user.user_id).toBe('number');
  });

  test('동일 이메일로 중복 생성 시 DB 에러가 발생한다', async () => {
    await create(TEST_USER);
    await expect(create(TEST_USER)).rejects.toThrow();
  });
});

// ────────────────────────────────────────────────
describe('BE-10-2: findByEmail', () => {
  test('존재하는 이메일 조회 시 User 객체를 반환한다', async () => {
    await create(TEST_USER);
    const user = await findByEmail(TEST_USER.email);
    expect(user).not.toBeNull();
    expect(user.email).toBe(TEST_USER.email);
  });

  test('존재하지 않는 이메일 조회 시 null 을 반환한다', async () => {
    const user = await findByEmail('notexist@example.com');
    expect(user).toBeNull();
  });

  test('대소문자가 다른 이메일은 null 을 반환한다 (PostgreSQL 기본 동작)', async () => {
    await create(TEST_USER);
    const user = await findByEmail('REPO@EXAMPLE.COM');
    expect(user).toBeNull();
  });
});

// ────────────────────────────────────────────────
describe('BE-10-3: findById', () => {
  test('존재하는 userId 조회 시 User 객체를 반환한다', async () => {
    const created = await create(TEST_USER);
    const user = await findById(created.user_id);
    expect(user).not.toBeNull();
    expect(user.user_id).toBe(created.user_id);
    expect(user.email).toBe(TEST_USER.email);
  });

  test('존재하지 않는 userId 조회 시 null 을 반환한다', async () => {
    const user = await findById(999999);
    expect(user).toBeNull();
  });
});

// ────────────────────────────────────────────────
describe('BE-10-4: updateById', () => {
  test('name 을 수정하고 수정된 User 를 반환한다', async () => {
    const created = await create(TEST_USER);
    const updated = await updateById(created.user_id, { name: '수정된이름' });
    expect(updated.name).toBe('수정된이름');
    expect(updated.email).toBe(TEST_USER.email);
  });

  test('password 를 수정하고 수정된 User 를 반환한다', async () => {
    const created = await create(TEST_USER);
    const newHash = '$2b$10$newhash';
    const updated = await updateById(created.user_id, { password: newHash });
    expect(updated.password).toBe(newHash);
  });

  test('name 과 password 동시 수정이 가능하다', async () => {
    const created = await create(TEST_USER);
    const updated = await updateById(created.user_id, {
      name: '동시수정',
      password: '$2b$10$bothchange',
    });
    expect(updated.name).toBe('동시수정');
    expect(updated.password).toBe('$2b$10$bothchange');
  });

  test('빈 input 전달 시 기존 사용자 정보를 그대로 반환한다', async () => {
    const created = await create(TEST_USER);
    const result = await updateById(created.user_id, {});
    expect(result.email).toBe(TEST_USER.email);
    expect(result.name).toBe(TEST_USER.name);
  });

  test('존재하지 않는 userId 수정 시 null 을 반환한다', async () => {
    const result = await updateById(999999, { name: '없음' });
    expect(result).toBeNull();
  });
});

// ────────────────────────────────────────────────
describe('BE-10-5: removeById', () => {
  test('사용자를 삭제하면 이후 findById 가 null 을 반환한다', async () => {
    const created = await create(TEST_USER);
    await removeById(created.user_id);
    const user = await findById(created.user_id);
    expect(user).toBeNull();
  });

  test('존재하지 않는 userId 삭제 시 에러가 발생하지 않는다', async () => {
    await expect(removeById(999999)).resolves.not.toThrow();
  });
});

// ────────────────────────────────────────────────
describe('BE-10-6: 파라미터 바인딩 및 비즈니스 규칙 없음 검증', () => {
  const fs = require('fs');
  let src;
  beforeAll(() => {
    src = fs.readFileSync(
      path.join(__dirname, '../repositories/user.repository.js'), 'utf8'
    );
  });

  test('SQL 에 $1, $2 바인딩을 사용한다', () => {
    expect(src).toMatch(/\$1/);
  });

  test('SQL 값 바인딩에 사용자 입력이 직접 삽입되지 않는다 (VALUES 절에 $N 사용)', () => {
    // INSERT/UPDATE 의 VALUES 또는 WHERE 절에 사용자 값이 직접 삽입되지 않음
    // updateById 의 동적 필드명(name, password — 하드코딩)은 안전한 패턴
    expect(src).toMatch(/VALUES\s*\(\s*\$1/); // INSERT 는 파라미터 바인딩 사용
    expect(src).toMatch(/WHERE\s+\S+\s*=\s*\$\d/); // WHERE 절도 파라미터 바인딩 사용
  });

  test('throw 나 AppError 등 비즈니스 규칙 코드가 없다', () => {
    expect(src).not.toMatch(/throw\s+new\s+AppError/);
    expect(src).not.toMatch(/if\s*\(.*duplicate\|conflict\|already/i);
  });
});
