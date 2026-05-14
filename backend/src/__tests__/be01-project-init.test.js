'use strict';

/**
 * BE-01: 프로젝트 초기화 완료 조건 검증 테스트
 *
 * 검증 항목:
 *   1. package.json 필수 의존성 존재 여부
 *   2. backend/src/ 하위 8개 디렉토리 생성 여부
 *   3. CommonJS 방식 사용 여부 (type: "module" 없음)
 *   4. .gitignore 에 .env 포함 여부
 *   5. package.json scripts(dev, start, test) 정의 여부
 */

const fs   = require('fs');
const path = require('path');

// ─── 경로 상수 ──────────────────────────────────────────────────────────────
// 테스트 파일 위치: backend/src/__tests__/
// __dirname → backend/src/__tests__
// backendRoot → backend/
const BACKEND_ROOT  = path.join(__dirname, '..', '..');
const PACKAGE_JSON  = path.join(BACKEND_ROOT, 'package.json');
const GITIGNORE     = path.join(BACKEND_ROOT, '.gitignore');
const SRC_DIR       = path.join(BACKEND_ROOT, 'src');

// ─── 헬퍼 ───────────────────────────────────────────────────────────────────

/**
 * package.json 을 파싱해 반환한다.
 * 파일이 없거나 파싱 실패 시 null 을 반환한다.
 */
function readPackageJson() {
  try {
    return JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * semver 범위 문자열의 형식이 올바른지 간단히 검증한다.
 * 허용 접두사: ^, ~, >=, >, =, 없음
 * ex) "^4.21.2", "~1.0.0", ">=1.0.0", "1.0.0"
 */
function isValidVersionFormat(version) {
  if (typeof version !== 'string') return false;
  return /^[~^><=]*\d+\.\d+\.\d+/.test(version);
}

// ─── 1. package.json 필수 의존성 ────────────────────────────────────────────

describe('BE-01-1: package.json 필수 의존성', () => {
  let pkg;

  beforeAll(() => {
    pkg = readPackageJson();
  });

  test('package.json 파일이 존재한다', () => {
    expect(fs.existsSync(PACKAGE_JSON)).toBe(true);
  });

  test('package.json 이 유효한 JSON 으로 파싱된다', () => {
    expect(pkg).not.toBeNull();
    expect(typeof pkg).toBe('object');
  });

  // dependencies
  const requiredDependencies = [
    'express',
    'pg',
    'bcrypt',
    'jsonwebtoken',
    'dotenv',
    'cors',
  ];

  test.each(requiredDependencies)(
    'dependencies 에 "%s" 이 존재한다',
    (dep) => {
      expect(pkg).not.toBeNull();
      expect(pkg.dependencies).toBeDefined();
      expect(pkg.dependencies[dep]).toBeDefined();
    },
  );

  // devDependencies
  const requiredDevDependencies = ['nodemon', 'jest', 'supertest'];

  test.each(requiredDevDependencies)(
    'devDependencies 에 "%s" 이 존재한다',
    (dep) => {
      expect(pkg).not.toBeNull();
      expect(pkg.devDependencies).toBeDefined();
      expect(pkg.devDependencies[dep]).toBeDefined();
    },
  );

  // 경계값: 버전 형식 검증
  test('모든 dependencies 버전이 유효한 semver 형식이다', () => {
    expect(pkg).not.toBeNull();
    const deps = pkg.dependencies || {};
    const invalidDeps = Object.entries(deps)
      .filter(([, ver]) => !isValidVersionFormat(ver))
      .map(([name, ver]) => `${name}@${ver}`);
    expect(invalidDeps).toHaveLength(0);
  });

  test('모든 devDependencies 버전이 유효한 semver 형식이다', () => {
    expect(pkg).not.toBeNull();
    const devDeps = pkg.devDependencies || {};
    const invalidDevDeps = Object.entries(devDeps)
      .filter(([, ver]) => !isValidVersionFormat(ver))
      .map(([name, ver]) => `${name}@${ver}`);
    expect(invalidDevDeps).toHaveLength(0);
  });

  // 경계값: 빈 문자열 버전이 없는지 검증
  test('dependencies 에 빈 문자열 버전이 없다', () => {
    expect(pkg).not.toBeNull();
    const deps = pkg.dependencies || {};
    const emptyVersionDeps = Object.entries(deps)
      .filter(([, ver]) => typeof ver !== 'string' || ver.trim() === '')
      .map(([name]) => name);
    expect(emptyVersionDeps).toHaveLength(0);
  });
});

// ─── 2. backend/src/ 하위 디렉토리 ──────────────────────────────────────────

describe('BE-01-2: backend/src/ 하위 디렉토리 생성', () => {
  const requiredDirectories = [
    'config',
    'middleware',
    'routes',
    'controllers',
    'services',
    'repositories',
    'constants',
    'utils',
  ];

  test('src 디렉토리 자체가 존재한다', () => {
    expect(fs.existsSync(SRC_DIR)).toBe(true);
    expect(fs.statSync(SRC_DIR).isDirectory()).toBe(true);
  });

  test.each(requiredDirectories)(
    'src/%s 디렉토리가 존재한다',
    (dir) => {
      const targetPath = path.join(SRC_DIR, dir);
      expect(fs.existsSync(targetPath)).toBe(true);
      expect(fs.statSync(targetPath).isDirectory()).toBe(true);
    },
  );

  test('필수 디렉토리 8개가 모두 존재한다', () => {
    const missing = requiredDirectories.filter(
      (dir) => !fs.existsSync(path.join(SRC_DIR, dir)),
    );
    expect(missing).toHaveLength(0);
  });

  // 경계값: 디렉토리가 파일이 아닌 진짜 디렉토리인지 검증
  test.each(requiredDirectories)(
    'src/%s 는 파일이 아닌 디렉토리다',
    (dir) => {
      const targetPath = path.join(SRC_DIR, dir);
      if (fs.existsSync(targetPath)) {
        expect(fs.statSync(targetPath).isDirectory()).toBe(true);
        expect(fs.statSync(targetPath).isFile()).toBe(false);
      }
    },
  );
});

// ─── 3. CommonJS 방식 사용 여부 ─────────────────────────────────────────────

describe('BE-01-3: CommonJS 방식 사용 (type: "module" 없음)', () => {
  let pkg;

  beforeAll(() => {
    pkg = readPackageJson();
  });

  test('package.json 에 "type" 필드가 없거나 "commonjs" 이다', () => {
    expect(pkg).not.toBeNull();
    const type = pkg.type;
    // type 필드가 아예 없거나, 명시적으로 "commonjs" 인 경우만 허용
    expect(type === undefined || type === 'commonjs').toBe(true);
  });

  test('package.json 에 "type": "module" 이 없다', () => {
    expect(pkg).not.toBeNull();
    expect(pkg.type).not.toBe('module');
  });

  // 경계값: type 필드가 존재한다면 허용 값만 가진다
  test('type 필드가 존재하면 빈 문자열이 아니다', () => {
    expect(pkg).not.toBeNull();
    if (pkg.type !== undefined) {
      expect(pkg.type.trim()).not.toBe('');
    }
  });
});

// ─── 4. .gitignore 에 .env 포함 여부 ────────────────────────────────────────

describe('BE-01-4: .gitignore 에 .env 포함', () => {
  let gitignoreContent;
  let gitignoreLines;

  beforeAll(() => {
    if (fs.existsSync(GITIGNORE)) {
      gitignoreContent = fs.readFileSync(GITIGNORE, 'utf8');
      // 빈 줄·주석 제거 후 각 패턴을 trim
      gitignoreLines = gitignoreContent
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('#'));
    } else {
      gitignoreContent = null;
      gitignoreLines   = [];
    }
  });

  test('.gitignore 파일이 존재한다', () => {
    expect(fs.existsSync(GITIGNORE)).toBe(true);
  });

  test('.gitignore 가 비어 있지 않다', () => {
    expect(gitignoreContent).not.toBeNull();
    expect(gitignoreContent.trim().length).toBeGreaterThan(0);
  });

  test('.gitignore 에 .env 패턴이 포함되어 있다', () => {
    // ".env" 또는 "*.env" 또는 ".env*" 를 포함하는 줄이 하나 이상 있어야 함
    const hasEnvPattern = gitignoreLines.some(
      (line) => line === '.env' || line === '*.env' || line.startsWith('.env'),
    );
    expect(hasEnvPattern).toBe(true);
  });

  // 경계값: .env 가 주석 처리되지 않고 실제 패턴으로 존재하는지
  test('.env 패턴이 주석 처리되지 않고 활성화되어 있다', () => {
    // gitignoreLines 는 이미 주석 줄을 제거한 배열이므로
    // 해당 배열에서 .env 를 찾으면 주석이 아님
    const activeEnvLine = gitignoreLines.find(
      (line) => line === '.env' || line.startsWith('.env'),
    );
    expect(activeEnvLine).toBeDefined();
  });

  // 경계값: node_modules 도 gitignore 에 있는지 (일반적인 초기화 점검)
  test('.gitignore 에 node_modules 패턴이 포함되어 있다', () => {
    const hasNodeModules = gitignoreLines.some((line) =>
      line.includes('node_modules'),
    );
    expect(hasNodeModules).toBe(true);
  });
});

// ─── 5. package.json scripts 정의 여부 ──────────────────────────────────────

describe('BE-01-5: package.json scripts 정의', () => {
  let pkg;

  beforeAll(() => {
    pkg = readPackageJson();
  });

  test('package.json 에 scripts 섹션이 존재한다', () => {
    expect(pkg).not.toBeNull();
    expect(pkg.scripts).toBeDefined();
    expect(typeof pkg.scripts).toBe('object');
  });

  test('"dev" 스크립트가 "nodemon src/server.js" 로 정의되어 있다', () => {
    expect(pkg).not.toBeNull();
    expect(pkg.scripts.dev).toBe('nodemon src/server.js');
  });

  test('"start" 스크립트가 "node src/server.js" 로 정의되어 있다', () => {
    expect(pkg).not.toBeNull();
    expect(pkg.scripts.start).toBe('node src/server.js');
  });

  test('"test" 스크립트가 "jest" 로 정의되어 있다', () => {
    expect(pkg).not.toBeNull();
    expect(pkg.scripts.test).toBe('jest');
  });

  // 경계값: 각 스크립트 값이 빈 문자열이 아님
  const scriptKeys = ['dev', 'start', 'test'];

  test.each(scriptKeys)(
    '"%s" 스크립트 값이 빈 문자열이 아니다',
    (key) => {
      expect(pkg).not.toBeNull();
      expect(pkg.scripts[key]).toBeDefined();
      expect(pkg.scripts[key].trim()).not.toBe('');
    },
  );

  // 경계값: scripts 값이 문자열 타입
  test.each(scriptKeys)(
    '"%s" 스크립트 값이 문자열 타입이다',
    (key) => {
      expect(pkg).not.toBeNull();
      expect(typeof pkg.scripts[key]).toBe('string');
    },
  );
});
