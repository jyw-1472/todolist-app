/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.js'],
  globalSetup: './src/test/globalSetup.js',
  moduleFileExtensions: ['js', 'json'],
  // 테스트 DB(todolist_test_db)를 공유하므로 병렬 실행 시 데이터 경합 발생 — 순차 실행 강제
  maxWorkers: 1,
};

module.exports = config;
