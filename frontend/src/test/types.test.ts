import { describe, it, expect } from 'vitest'
import { ErrorCode } from '../types/api.types'
import type { ApiError, ApiResponse } from '../types/api.types'
import type { Nullable, Optional } from '../types/common.types'

describe('ErrorCode', () => {
  it('PRD 6.2의 9개 에러 코드를 모두 포함한다', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN')
    expect(ErrorCode.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND')
    expect(ErrorCode.DUPLICATE_EMAIL).toBe('DUPLICATE_EMAIL')
    expect(ErrorCode.DUPLICATE_CATEGORY).toBe('DUPLICATE_CATEGORY')
    expect(ErrorCode.CATEGORY_HAS_TODOS).toBe('CATEGORY_HAS_TODOS')
    expect(ErrorCode.DEFAULT_CATEGORY_IMMUTABLE).toBe('DEFAULT_CATEGORY_IMMUTABLE')
    expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR')
  })

  it('총 9개의 에러 코드가 있다', () => {
    const codes = Object.keys(ErrorCode)
    expect(codes).toHaveLength(9)
  })
})

describe('ApiError 타입', () => {
  it('code와 message 필드를 가진 객체를 생성할 수 있다', () => {
    const error: ApiError = {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: '요청한 리소스를 찾을 수 없습니다.',
    }
    expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
    expect(error.message).toBe('요청한 리소스를 찾을 수 없습니다.')
  })
})

describe('ApiResponse<T> 타입', () => {
  it('data 필드를 가진 성공 응답을 표현할 수 있다', () => {
    const response: ApiResponse<{ id: number }> = {
      data: { id: 1 },
    }
    expect(response.data).toEqual({ id: 1 })
    expect(response.error).toBeUndefined()
  })

  it('error 필드를 가진 실패 응답을 표현할 수 있다', () => {
    const response: ApiResponse<never> = {
      error: { code: ErrorCode.UNAUTHORIZED, message: '인증이 필요합니다.' },
    }
    expect(response.error?.code).toBe(ErrorCode.UNAUTHORIZED)
    expect(response.data).toBeUndefined()
  })
})

describe('Nullable<T> 타입', () => {
  it('값 또는 null을 허용한다', () => {
    const value: Nullable<string> = 'hello'
    const nullValue: Nullable<string> = null
    expect(value).toBe('hello')
    expect(nullValue).toBeNull()
  })
})

describe('Optional<T> 타입', () => {
  it('값 또는 undefined를 허용한다', () => {
    const value: Optional<number> = 42
    const undefinedValue: Optional<number> = undefined
    expect(value).toBe(42)
    expect(undefinedValue).toBeUndefined()
  })
})
