import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import axiosInstance from '../api/axiosInstance'
import { getCategories, createCategory, deleteCategory } from '../api/category.api'

const mock = new MockAdapter(axiosInstance)

beforeEach(() => {
  mock.reset()
})

afterEach(() => {
  mock.reset()
})

const mockCategories = [
  { category_id: 1, user_id: null, name: '전체', is_default: true },
  { category_id: 2, user_id: null, name: '업무', is_default: false },
  { category_id: 3, user_id: 1, name: '연구', is_default: false },
]

describe('getCategories', () => {
  it('성공 시 Category 배열을 반환한다', async () => {
    mock.onGet('/categories').reply(200, { data: mockCategories })
    const result = await getCategories()
    expect(result).toEqual(mockCategories)
  })

  it('기본 카테고리(user_id: null)와 사용자 카테고리가 모두 포함된다', async () => {
    mock.onGet('/categories').reply(200, { data: mockCategories })
    const result = await getCategories()
    const defaultCats = result.filter((c) => c.user_id === null)
    const userCats = result.filter((c) => c.user_id !== null)
    expect(defaultCats.length).toBeGreaterThan(0)
    expect(userCats.length).toBeGreaterThan(0)
  })

  it('401 에러 시 reject된다', async () => {
    mock.onGet('/categories').reply(401, { error: { code: 'UNAUTHORIZED', message: '인증 필요' } })
    await expect(getCategories()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe('createCategory', () => {
  it('성공 시 생성된 Category를 반환한다', async () => {
    const newCategory = { category_id: 4, user_id: 1, name: '독서', is_default: false }
    mock.onPost('/categories').reply(201, { data: newCategory })
    const result = await createCategory({ name: '독서' })
    expect(result).toEqual(newCategory)
  })

  it('요청 바디에 name이 포함된다', async () => {
    let capturedBody: unknown
    mock.onPost('/categories').reply((config) => {
      capturedBody = JSON.parse(config.data as string)
      return [201, { data: { category_id: 5, user_id: 1, name: '운동', is_default: false } }]
    })
    await createCategory({ name: '운동' })
    expect(capturedBody).toEqual({ name: '운동' })
  })

  it('409 이름 중복 시 reject된다', async () => {
    mock.onPost('/categories').reply(409, { error: { code: 'DUPLICATE_CATEGORY', message: '중복' } })
    await expect(createCategory({ name: '업무' })).rejects.toMatchObject({ response: { status: 409 } })
  })

  it('403 기본 카테고리 수정 시도 시 reject된다', async () => {
    mock.onPost('/categories').reply(403, { error: { code: 'DEFAULT_CATEGORY_IMMUTABLE', message: '불가' } })
    await expect(createCategory({ name: '전체' })).rejects.toMatchObject({ response: { status: 403 } })
  })
})

describe('deleteCategory', () => {
  it('성공 시 resolve된다', async () => {
    mock.onDelete('/categories/3').reply(204)
    await expect(deleteCategory(3)).resolves.toBeUndefined()
  })

  it('올바른 URL로 요청한다', async () => {
    let capturedUrl: string | undefined
    mock.onDelete('/categories/7').reply((config) => {
      capturedUrl = config.url
      return [204]
    })
    await deleteCategory(7)
    expect(capturedUrl).toBe('/categories/7')
  })

  it('409 할일 존재 시 reject된다', async () => {
    mock.onDelete('/categories/3').reply(409, { error: { code: 'CATEGORY_HAS_TODOS', message: '할일 존재' } })
    await expect(deleteCategory(3)).rejects.toMatchObject({ response: { status: 409 } })
  })

  it('403 기본 카테고리 삭제 시도 시 reject된다', async () => {
    mock.onDelete('/categories/1').reply(403, { error: { code: 'DEFAULT_CATEGORY_IMMUTABLE', message: '불가' } })
    await expect(deleteCategory(1)).rejects.toMatchObject({ response: { status: 403 } })
  })

  it('404 존재하지 않는 카테고리 삭제 시 reject된다', async () => {
    mock.onDelete('/categories/999').reply(404, { error: { code: 'RESOURCE_NOT_FOUND', message: '없음' } })
    await expect(deleteCategory(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
