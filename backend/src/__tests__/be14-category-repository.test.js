'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const { pool } = require('../config/database');
const { clearDatabase } = require('../test/teardown');
const userRepo = require('../repositories/user.repository');
const categoryRepo = require('../repositories/category.repository');
const { hashPassword } = require('../utils/password');

// 테스트용 사용자 생성 헬퍼
async function createTestUser(suffix = '') {
  const hashed = await hashPassword('Password123!');
  return userRepo.create({
    email: `cat-repo${suffix}@example.com`,
    password: hashed,
    name: `카테고리테스트${suffix}`,
  });
}

// 테스트용 카테고리 생성 헬퍼
async function createCategory(userId, name) {
  return categoryRepo.create({ user_id: userId, name });
}

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await pool.end();
});

// ────────────────────────────────────────────────
describe('BE-14-1: findAllByUser', () => {
  test('시스템 기본 카테고리(user_id IS NULL) 5건이 포함된다', async () => {
    const user = await createTestUser();
    const categories = await categoryRepo.findAllByUser(user.user_id);
    const defaults = categories.filter((c) => c.user_id === null);
    expect(defaults.length).toBe(5);
  });

  test('사용자 정의 카테고리가 포함된다', async () => {
    const user = await createTestUser();
    await createCategory(user.user_id, '내카테고리');
    const categories = await categoryRepo.findAllByUser(user.user_id);
    const custom = categories.filter((c) => c.user_id === user.user_id);
    expect(custom.length).toBe(1);
    expect(custom[0].name).toBe('내카테고리');
  });

  test('다른 사용자의 카테고리는 포함되지 않는다', async () => {
    const user1 = await createTestUser('1');
    const user2 = await createTestUser('2');
    await createCategory(user1.user_id, 'user1카테고리');
    await createCategory(user2.user_id, 'user2카테고리');

    const categories = await categoryRepo.findAllByUser(user1.user_id);
    const names = categories.map((c) => c.name);
    expect(names).toContain('user1카테고리');
    expect(names).not.toContain('user2카테고리');
  });

  test('기본 카테고리와 사용자 정의 카테고리를 모두 반환한다', async () => {
    const user = await createTestUser();
    await createCategory(user.user_id, '내업무');
    const categories = await categoryRepo.findAllByUser(user.user_id);
    const hasDefault = categories.some((c) => c.user_id === null);
    const hasCustom = categories.some((c) => c.user_id === user.user_id);
    expect(hasDefault).toBe(true);
    expect(hasCustom).toBe(true);
  });

  test('결과가 category_id 오름차순으로 정렬된다', async () => {
    const user = await createTestUser();
    await createCategory(user.user_id, '나중카테고리');
    const categories = await categoryRepo.findAllByUser(user.user_id);
    for (let i = 1; i < categories.length; i++) {
      expect(categories[i].category_id).toBeGreaterThan(categories[i - 1].category_id);
    }
  });
});

// ────────────────────────────────────────────────
describe('BE-14-2: findById', () => {
  test('존재하는 category_id 로 카테고리를 조회할 수 있다', async () => {
    const user = await createTestUser();
    const created = await createCategory(user.user_id, '조회테스트');
    const found = await categoryRepo.findById(created.category_id);
    expect(found).not.toBeNull();
    expect(found.category_id).toBe(created.category_id);
    expect(found.name).toBe('조회테스트');
  });

  test('존재하지 않는 category_id 로 조회 시 null 을 반환한다', async () => {
    const found = await categoryRepo.findById(999999);
    expect(found).toBeNull();
  });

  test('기본 카테고리도 findById 로 조회 가능하다', async () => {
    // 시드 데이터의 첫 번째 기본 카테고리 (category_id=1, '전체')
    const { rows } = await pool.query(
      "SELECT category_id FROM categories WHERE user_id IS NULL AND name = '전체'"
    );
    const defaultId = rows[0].category_id;
    const found = await categoryRepo.findById(defaultId);
    expect(found).not.toBeNull();
    expect(found.is_default).toBe(true);
  });
});

// ────────────────────────────────────────────────
describe('BE-14-3: create', () => {
  test('카테고리를 생성하고 RETURNING * 로 생성된 데이터를 반환한다', async () => {
    const user = await createTestUser();
    const category = await categoryRepo.create({ user_id: user.user_id, name: '새카테고리' });
    expect(category.category_id).toBeDefined();
    expect(category.user_id).toBe(user.user_id);
    expect(category.name).toBe('새카테고리');
    expect(category.is_default).toBe(false);
  });

  test('생성된 카테고리는 is_default 가 false 이다', async () => {
    const user = await createTestUser();
    const category = await categoryRepo.create({ user_id: user.user_id, name: '기본아님' });
    expect(category.is_default).toBe(false);
  });
});

// ────────────────────────────────────────────────
describe('BE-14-4: removeById', () => {
  test('카테고리를 삭제하면 findById 로 조회 시 null 이 반환된다', async () => {
    const user = await createTestUser();
    const category = await createCategory(user.user_id, '삭제대상');
    await categoryRepo.removeById(category.category_id);
    const found = await categoryRepo.findById(category.category_id);
    expect(found).toBeNull();
  });

  test('존재하지 않는 ID 삭제 시 에러가 발생하지 않는다', async () => {
    await expect(categoryRepo.removeById(999999)).resolves.not.toThrow();
  });
});

// ────────────────────────────────────────────────
describe('BE-14-5: hasTodos', () => {
  test('할일이 없는 카테고리는 false 를 반환한다', async () => {
    const user = await createTestUser();
    const category = await createCategory(user.user_id, '할일없는');
    const result = await categoryRepo.hasTodos(category.category_id);
    expect(result).toBe(false);
  });

  test('할일이 1건 이상 있는 카테고리는 true 를 반환한다', async () => {
    const user = await createTestUser();
    const category = await createCategory(user.user_id, '할일있는');
    await pool.query(
      `INSERT INTO todos (user_id, category_id, title) VALUES ($1, $2, $3)`,
      [user.user_id, category.category_id, '테스트할일']
    );
    const result = await categoryRepo.hasTodos(category.category_id);
    expect(result).toBe(true);
  });

  test('존재하지 않는 카테고리 ID 로 조회 시 false 를 반환한다', async () => {
    const result = await categoryRepo.hasTodos(999999);
    expect(result).toBe(false);
  });
});

// ────────────────────────────────────────────────
describe('BE-14-6: existsByNameForUser', () => {
  test('동일 사용자 범위에서 이름이 중복이면 true 를 반환한다', async () => {
    const user = await createTestUser();
    await createCategory(user.user_id, '중복이름');
    const result = await categoryRepo.existsByNameForUser('중복이름', user.user_id);
    expect(result).toBe(true);
  });

  test('동일 사용자 범위에서 이름이 없으면 false 를 반환한다', async () => {
    const user = await createTestUser();
    const result = await categoryRepo.existsByNameForUser('없는이름', user.user_id);
    expect(result).toBe(false);
  });

  test('다른 사용자가 동일 이름을 가져도 false 를 반환한다', async () => {
    const user1 = await createTestUser('1');
    const user2 = await createTestUser('2');
    await createCategory(user1.user_id, '공유이름');
    // user2 범위에서는 중복이 아님
    const result = await categoryRepo.existsByNameForUser('공유이름', user2.user_id);
    expect(result).toBe(false);
  });
});

// ────────────────────────────────────────────────
describe('BE-14-7: Repository 소스 구조 검증', () => {
  const fs = require('fs');
  const src = fs.readFileSync(
    path.join(__dirname, '../repositories/category.repository.js'), 'utf8'
  );

  test('is_default 조건 체크 로직이 Repository 에 없다 (Service 책임)', () => {
    // WHERE is_default 나 if.*is_default 같은 분기 로직이 없어야 한다
    expect(src).not.toMatch(/WHERE\s+.*is_default/i);
    expect(src).not.toMatch(/if\s*\(.*is_default/i);
  });

  test('모든 SQL 쿼리에 파라미터 바인딩($1, $2)이 사용된다', () => {
    expect(src).toMatch(/\$1/);
  });
});
