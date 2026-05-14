import { ErrorCode } from '../types/api.types'

const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCode.VALIDATION_ERROR]: '입력값이 올바르지 않습니다.',
  [ErrorCode.UNAUTHORIZED]: '인증이 필요합니다. 다시 로그인해주세요.',
  [ErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCode.RESOURCE_NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCode.DUPLICATE_EMAIL]: '이미 사용 중인 이메일입니다.',
  [ErrorCode.DUPLICATE_CATEGORY]: '이미 존재하는 카테고리 이름입니다.',
  [ErrorCode.CATEGORY_HAS_TODOS]: '할일이 존재하는 카테고리는 삭제할 수 없습니다.',
  [ErrorCode.DEFAULT_CATEGORY_IMMUTABLE]: '기본 카테고리는 수정하거나 삭제할 수 없습니다.',
  [ErrorCode.INTERNAL_SERVER_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
}

export function getErrorMessage(code: ErrorCode | string): string {
  return ERROR_MESSAGES[code] ?? '알 수 없는 오류가 발생했습니다.'
}
