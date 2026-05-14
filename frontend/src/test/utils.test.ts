import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTodayString, formatDate, isPastDate, isOverdue } from '../utils/date'
import { getErrorMessage } from '../utils/errorMessage'
import { ErrorCode } from '../types/api.types'

const FIXED_TODAY = '2026-05-14'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-05-14T12:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getTodayString()', () => {
  it('오늘 날짜를 YYYY-MM-DD 형식으로 반환한다', () => {
    expect(getTodayString()).toBe(FIXED_TODAY)
  })
})

describe('formatDate()', () => {
  it('YYYY-MM-DD를 YYYY년 MM월 DD일 형식으로 변환한다', () => {
    expect(formatDate('2026-05-14')).toBe('2026년 05월 14일')
  })

  it('다른 날짜도 올바르게 변환한다', () => {
    expect(formatDate('2024-01-01')).toBe('2024년 01월 01일')
  })
})

describe('isPastDate()', () => {
  it('오늘보다 이전 날짜는 true를 반환한다', () => {
    expect(isPastDate('2026-05-13')).toBe(true)
  })

  it('오늘 날짜는 false를 반환한다', () => {
    expect(isPastDate(FIXED_TODAY)).toBe(false)
  })

  it('오늘보다 이후 날짜는 false를 반환한다', () => {
    expect(isPastDate('2026-05-15')).toBe(false)
  })
})

describe('isOverdue()', () => {
  it('마감일이 오늘보다 이전이면 true를 반환한다', () => {
    expect(isOverdue('2026-05-13')).toBe(true)
  })

  it('마감일이 오늘이면 false를 반환한다', () => {
    expect(isOverdue(FIXED_TODAY)).toBe(false)
  })

  it('마감일이 오늘보다 이후이면 false를 반환한다', () => {
    expect(isOverdue('2026-05-15')).toBe(false)
  })
})

describe('getErrorMessage()', () => {
  it('VALIDATION_ERROR → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.VALIDATION_ERROR)).toBe('입력값이 올바르지 않습니다.')
  })

  it('UNAUTHORIZED → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.UNAUTHORIZED)).toBe(
      '인증이 필요합니다. 다시 로그인해주세요.'
    )
  })

  it('FORBIDDEN → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.FORBIDDEN)).toBe('접근 권한이 없습니다.')
  })

  it('RESOURCE_NOT_FOUND → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.RESOURCE_NOT_FOUND)).toBe(
      '요청한 리소스를 찾을 수 없습니다.'
    )
  })

  it('DUPLICATE_EMAIL → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.DUPLICATE_EMAIL)).toBe('이미 사용 중인 이메일입니다.')
  })

  it('DUPLICATE_CATEGORY → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.DUPLICATE_CATEGORY)).toBe(
      '이미 존재하는 카테고리 이름입니다.'
    )
  })

  it('CATEGORY_HAS_TODOS → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.CATEGORY_HAS_TODOS)).toBe(
      '할일이 존재하는 카테고리는 삭제할 수 없습니다.'
    )
  })

  it('DEFAULT_CATEGORY_IMMUTABLE → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.DEFAULT_CATEGORY_IMMUTABLE)).toBe(
      '기본 카테고리는 수정하거나 삭제할 수 없습니다.'
    )
  })

  it('INTERNAL_SERVER_ERROR → 한국어 메시지 반환', () => {
    expect(getErrorMessage(ErrorCode.INTERNAL_SERVER_ERROR)).toBe(
      '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    )
  })

  it('알 수 없는 코드는 기본 메시지를 반환한다', () => {
    expect(getErrorMessage('UNKNOWN_CODE')).toBe('알 수 없는 오류가 발생했습니다.')
  })
})
