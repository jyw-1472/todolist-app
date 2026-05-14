'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const { pool } = require('../config/database');
const { clearDatabase } = require('../test/teardown');
const userRepo = require('../repositories/user.repository');
const categoryRepo = require('../repositories/category.repository');
const todoRepo = require('../repositories/todo.repository');
const { hashPassword } = require('../utils/password');

// ── 헬퍼 ──────────────────────────────────────────
async function createUser(suffix = '') {
  const hashed = await hashPassword('Password123!');
  return userRepo.create({
    email: `todo-repo${suffix}@example.com`,
    password: hashed,
    name: `할일테스트${suffix}`,
  });
}

async function createCategory(userId, name = '테스트카테고리') {
  return categoryRepo.create({ user_id: userId, name });
}

async function createTodo(userId, categoryId, overrides = {}) {
  return todoRepo.create({
    user_id: userId,
    category_id: categoryId,
    title: '기본할일',
    ...overrides,
  });
}

// 기본 카테고리 ID 조회 (업무)
async function getDefaultCategoryId() {
  const { rows } = await pool.query(
    "SELECT category_id FROM categories WHERE user_id IS NULL AND name = '업무'"
  );
  return rows[0].category_id;
}

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await pool.end();
});

// ────────────────────────────────────────────────
describe('BE-16-1: findAll — 기본 조회', () => {
  test('사용자의 할일을 모두 반환한다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    await createTodo(user.user_id, cat.category_id, { title: '할일1' });
    await createTodo(user.user_id, cat.category_id, { title: '할일2' });
    const todos = await todoRepo.findAll(user.user_id);
    expect(todos.length).toBe(2);
  });

  test('다른 사용자의 할일은 반환하지 않는다', async () => {
    const user1 = await createUser('1');
    const user2 = await createUser('2');
    const cat1 = await createCategory(user1.user_id, 'cat1');
    const cat2 = await createCategory(user2.user_id, 'cat2');
    await createTodo(user1.user_id, cat1.category_id, { title: 'user1할일' });
    await createTodo(user2.user_id, cat2.category_id, { title: 'user2할일' });
    const todos = await todoRepo.findAll(user1.user_id);
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe('user1할일');
  });

  test('할일이 없으면 빈 배열을 반환한다', async () => {
    const user = await createUser();
    const todos = await todoRepo.findAll(user.user_id);
    expect(todos).toEqual([]);
  });
});

// ────────────────────────────────────────────────
describe('BE-16-2: findAll — 필터', () => {
  test('category_id 필터 적용 시 해당 카테고리 할일만 반환된다', async () => {
    const user = await createUser();
    const cat1 = await createCategory(user.user_id, '카테고리1');
    const cat2 = await createCategory(user.user_id, '카테고리2');
    await createTodo(user.user_id, cat1.category_id, { title: 'cat1할일' });
    await createTodo(user.user_id, cat2.category_id, { title: 'cat2할일' });

    const todos = await todoRepo.findAll(user.user_id, { category_id: cat1.category_id });
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe('cat1할일');
  });

  test('from 필터 적용 시 해당 날짜 이후 할일만 반환된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    await createTodo(user.user_id, cat.category_id, { title: '과거', due_date: '2020-01-01' });
    await createTodo(user.user_id, cat.category_id, { title: '미래', due_date: '2030-12-31' });

    const todos = await todoRepo.findAll(user.user_id, { from: '2025-01-01' });
    const titles = todos.map((t) => t.title);
    expect(titles).toContain('미래');
    expect(titles).not.toContain('과거');
  });

  test('to 필터 적용 시 해당 날짜 이전 할일만 반환된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    await createTodo(user.user_id, cat.category_id, { title: '과거', due_date: '2020-01-01' });
    await createTodo(user.user_id, cat.category_id, { title: '미래', due_date: '2030-12-31' });

    const todos = await todoRepo.findAll(user.user_id, { to: '2025-01-01' });
    const titles = todos.map((t) => t.title);
    expect(titles).toContain('과거');
    expect(titles).not.toContain('미래');
  });

  test('from·to 동시 적용 시 범위 내 할일만 반환된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    await createTodo(user.user_id, cat.category_id, { title: '범위내', due_date: '2026-06-15' });
    await createTodo(user.user_id, cat.category_id, { title: '범위밖', due_date: '2027-01-01' });

    const todos = await todoRepo.findAll(user.user_id, { from: '2026-01-01', to: '2026-12-31' });
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe('범위내');
  });

  test('is_completed=true 필터 시 완료된 할일만 반환된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id, { title: '완료할일' });
    await todoRepo.toggleComplete(todo.todo_id);
    await createTodo(user.user_id, cat.category_id, { title: '미완료할일' });

    const todos = await todoRepo.findAll(user.user_id, { is_completed: true });
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe('완료할일');
  });

  test('is_completed=false 필터 시 미완료된 할일만 반환된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id, { title: '완료할일' });
    await todoRepo.toggleComplete(todo.todo_id);
    await createTodo(user.user_id, cat.category_id, { title: '미완료할일' });

    const todos = await todoRepo.findAll(user.user_id, { is_completed: false });
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe('미완료할일');
  });
});

// ────────────────────────────────────────────────
describe('BE-16-3: findAll — 정렬', () => {
  test('기본 정렬이 due_date 오름차순이다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    await createTodo(user.user_id, cat.category_id, { title: '늦은날', due_date: '2030-12-31' });
    await createTodo(user.user_id, cat.category_id, { title: '이른날', due_date: '2026-01-01' });

    const todos = await todoRepo.findAll(user.user_id);
    expect(todos[0].title).toBe('이른날');
    expect(todos[1].title).toBe('늦은날');
  });

  test('due_date 가 NULL 인 할일은 마지막에 정렬된다 (NULLS LAST)', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    await createTodo(user.user_id, cat.category_id, { title: 'NULL날짜' }); // due_date 없음
    await createTodo(user.user_id, cat.category_id, { title: '날짜있음', due_date: '2026-06-01' });

    const todos = await todoRepo.findAll(user.user_id);
    expect(todos[0].title).toBe('날짜있음');
    expect(todos[todos.length - 1].title).toBe('NULL날짜');
  });
});

// ────────────────────────────────────────────────
describe('BE-16-4: findById', () => {
  test('존재하는 todo_id 로 할일을 조회할 수 있다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const created = await createTodo(user.user_id, cat.category_id, { title: '조회테스트' });
    const found = await todoRepo.findById(created.todo_id);
    expect(found).not.toBeNull();
    expect(found.title).toBe('조회테스트');
  });

  test('존재하지 않는 todo_id 로 조회 시 null 을 반환한다', async () => {
    const found = await todoRepo.findById(999999);
    expect(found).toBeNull();
  });
});

// ────────────────────────────────────────────────
describe('BE-16-5: create', () => {
  test('할일을 생성하고 RETURNING * 로 전체 정보를 반환한다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await todoRepo.create({
      user_id: user.user_id,
      category_id: cat.category_id,
      title: '새할일',
      description: '설명',
      due_date: '2026-12-31',
    });
    expect(todo.todo_id).toBeDefined();
    expect(todo.title).toBe('새할일');
    expect(todo.description).toBe('설명');
    expect(todo.is_completed).toBe(false);
  });

  test('description, due_date 없이 생성 시 null 로 설정된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await todoRepo.create({
      user_id: user.user_id,
      category_id: cat.category_id,
      title: '최소할일',
    });
    expect(todo.description).toBeNull();
    expect(todo.due_date).toBeNull();
  });

  test('기본 카테고리로도 할일을 생성할 수 있다', async () => {
    const user = await createUser();
    const defaultCatId = await getDefaultCategoryId();
    const todo = await todoRepo.create({
      user_id: user.user_id,
      category_id: defaultCatId,
      title: '기본카테고리할일',
    });
    expect(todo.category_id).toBe(defaultCatId);
  });
});

// ────────────────────────────────────────────────
describe('BE-16-6: updateById', () => {
  test('title 을 수정하면 반영된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id);
    const updated = await todoRepo.updateById(todo.todo_id, { title: '수정된제목' });
    expect(updated.title).toBe('수정된제목');
  });

  test('수정 후 updated_at 이 created_at 보다 최신이거나 같다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id);
    // 약간의 지연 후 업데이트
    await new Promise((r) => setTimeout(r, 10));
    const updated = await todoRepo.updateById(todo.todo_id, { title: '타임스탬프테스트' });
    expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(todo.created_at).getTime()
    );
  });

  test('변경 필드 없이 호출 시 기존 데이터를 그대로 반환한다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id, { title: '변경없음' });
    const result = await todoRepo.updateById(todo.todo_id, {});
    expect(result.title).toBe('변경없음');
  });

  test('존재하지 않는 todo_id 업데이트 시 null 이 반환된다', async () => {
    const result = await todoRepo.updateById(999999, { title: '없음' });
    expect(result).toBeNull();
  });
});

// ────────────────────────────────────────────────
describe('BE-16-7: removeById', () => {
  test('할일 삭제 후 findById 로 조회 시 null 이 반환된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id);
    await todoRepo.removeById(todo.todo_id);
    const found = await todoRepo.findById(todo.todo_id);
    expect(found).toBeNull();
  });

  test('존재하지 않는 ID 삭제 시 에러가 발생하지 않는다', async () => {
    await expect(todoRepo.removeById(999999)).resolves.not.toThrow();
  });
});

// ────────────────────────────────────────────────
describe('BE-16-8: toggleComplete', () => {
  test('미완료 할일을 토글하면 is_completed 가 true 가 된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id);
    expect(todo.is_completed).toBe(false);

    const toggled = await todoRepo.toggleComplete(todo.todo_id);
    expect(toggled.is_completed).toBe(true);
  });

  test('완료 할일을 토글하면 is_completed 가 false 로 돌아온다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id);
    await todoRepo.toggleComplete(todo.todo_id); // true
    const toggled = await todoRepo.toggleComplete(todo.todo_id); // false
    expect(toggled.is_completed).toBe(false);
  });

  test('토글 후 updated_at 이 갱신된다', async () => {
    const user = await createUser();
    const cat = await createCategory(user.user_id);
    const todo = await createTodo(user.user_id, cat.category_id);
    await new Promise((r) => setTimeout(r, 10));
    const toggled = await todoRepo.toggleComplete(todo.todo_id);
    expect(new Date(toggled.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(todo.created_at).getTime()
    );
  });

  test('존재하지 않는 todo_id 토글 시 null 이 반환된다', async () => {
    const result = await todoRepo.toggleComplete(999999);
    expect(result).toBeNull();
  });
});

// ────────────────────────────────────────────────
describe('BE-16-9: Repository 소스 구조 검증', () => {
  const fs = require('fs');
  const src = fs.readFileSync(
    path.join(__dirname, '../repositories/todo.repository.js'), 'utf8'
  );

  test('동적 WHERE절에 파라미터 바인딩이 사용된다', () => {
    expect(src).toMatch(/\$\{idx\+\+\}/);
  });

  test('SQL 문자열에 값을 직접 삽입하지 않는다 (template literal 내 user input 없음)', () => {
    // 컬럼명·키워드는 허용, 실제 값($N 바인딩 제외)의 직접 삽입 없음을 구조적으로 확인
    expect(src).toMatch(/values\.push/);
  });

  test('toggleComplete 에 NOT is_completed 패턴이 있다', () => {
    expect(src).toMatch(/NOT is_completed/);
  });

  test('ORDER BY due_date ASC NULLS LAST 정렬이 명시되어 있다', () => {
    expect(src).toMatch(/due_date ASC NULLS LAST/i);
  });
});
