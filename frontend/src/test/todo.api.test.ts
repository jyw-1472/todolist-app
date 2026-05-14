import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import axiosInstance from '../api/axiosInstance'
import { getTodos, getTodoById, createTodo, updateTodo, deleteTodo, toggleTodoComplete } from '../api/todo.api'

const mock = new MockAdapter(axiosInstance)

beforeEach(() => mock.reset())
afterEach(() => mock.reset())

const mockTodo = {
  todo_id: 1,
  user_id: 1,
  category_id: 2,
  title: '팀 미팅 자료 준비',
  description: '3층 회의실',
  due_date: '2026-05-15',
  is_completed: false,
  created_at: '2026-05-14T09:00:00.000Z',
  updated_at: '2026-05-14T09:00:00.000Z',
}

describe('getTodos', () => {
  it('필터 없이 전체 할일 목록을 반환한다', async () => {
    mock.onGet('/todos').reply(200, { data: [mockTodo] })
    const result = await getTodos()
    expect(result).toEqual([mockTodo])
  })

  it('category_id 필터가 쿼리 파라미터로 직렬화된다', async () => {
    let capturedParams: Record<string, string> = {}
    mock.onGet('/todos').reply((config) => {
      capturedParams = config.params as Record<string, string>
      return [200, { data: [] }]
    })
    await getTodos({ category_id: 2 })
    expect(capturedParams.category_id).toBe('2')
  })

  it('from/to 필터가 쿼리 파라미터로 직렬화된다', async () => {
    let capturedParams: Record<string, string> = {}
    mock.onGet('/todos').reply((config) => {
      capturedParams = config.params as Record<string, string>
      return [200, { data: [] }]
    })
    await getTodos({ from: '2026-05-01', to: '2026-05-31' })
    expect(capturedParams.from).toBe('2026-05-01')
    expect(capturedParams.to).toBe('2026-05-31')
  })

  it('is_completed=false가 문자열 "false"로 직렬화된다', async () => {
    let capturedParams: Record<string, string> = {}
    mock.onGet('/todos').reply((config) => {
      capturedParams = config.params as Record<string, string>
      return [200, { data: [] }]
    })
    await getTodos({ is_completed: false })
    expect(capturedParams.is_completed).toBe('false')
  })

  it('is_completed=true가 문자열 "true"로 직렬화된다', async () => {
    let capturedParams: Record<string, string> = {}
    mock.onGet('/todos').reply((config) => {
      capturedParams = config.params as Record<string, string>
      return [200, { data: [] }]
    })
    await getTodos({ is_completed: true })
    expect(capturedParams.is_completed).toBe('true')
  })

  it('undefined 필터는 쿼리 파라미터에 포함되지 않는다', async () => {
    let capturedParams: Record<string, string> = {}
    mock.onGet('/todos').reply((config) => {
      capturedParams = config.params as Record<string, string>
      return [200, { data: [] }]
    })
    await getTodos({ category_id: undefined, from: '2026-05-01' })
    expect(capturedParams.category_id).toBeUndefined()
    expect(capturedParams.from).toBe('2026-05-01')
  })

  it('빈 필터 객체는 파라미터 없이 요청한다', async () => {
    let capturedParams: Record<string, string> = {}
    mock.onGet('/todos').reply((config) => {
      capturedParams = config.params as Record<string, string>
      return [200, { data: [] }]
    })
    await getTodos({})
    expect(Object.keys(capturedParams)).toHaveLength(0)
  })

  it('401 에러 시 reject된다', async () => {
    mock.onGet('/todos').reply(401, { error: { code: 'UNAUTHORIZED' } })
    await expect(getTodos()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe('getTodoById', () => {
  it('성공 시 단건 Todo를 반환한다', async () => {
    mock.onGet('/todos/1').reply(200, { data: mockTodo })
    const result = await getTodoById(1)
    expect(result).toEqual(mockTodo)
  })

  it('404 에러 시 reject된다', async () => {
    mock.onGet('/todos/999').reply(404, { error: { code: 'RESOURCE_NOT_FOUND' } })
    await expect(getTodoById(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe('createTodo', () => {
  it('성공 시 생성된 Todo를 반환한다', async () => {
    mock.onPost('/todos').reply(201, { data: mockTodo })
    const result = await createTodo({ title: '팀 미팅 자료 준비', category_id: 2 })
    expect(result).toEqual(mockTodo)
  })

  it('요청 바디에 title과 category_id가 포함된다', async () => {
    let capturedBody: unknown
    mock.onPost('/todos').reply((config) => {
      capturedBody = JSON.parse(config.data as string)
      return [201, { data: mockTodo }]
    })
    await createTodo({ title: '테스트', category_id: 3, description: '설명' })
    expect(capturedBody).toMatchObject({ title: '테스트', category_id: 3, description: '설명' })
  })

  it('404 존재하지 않는 category_id 시 reject된다', async () => {
    mock.onPost('/todos').reply(404, { error: { code: 'RESOURCE_NOT_FOUND' } })
    await expect(createTodo({ title: '테스트', category_id: 999 })).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

describe('updateTodo', () => {
  it('성공 시 수정된 Todo를 반환한다', async () => {
    const updated = { ...mockTodo, title: '수정된 제목' }
    mock.onPatch('/todos/1').reply(200, { data: updated })
    const result = await updateTodo(1, { title: '수정된 제목' })
    expect(result.title).toBe('수정된 제목')
  })

  it('403 타인 소유 Todo 수정 시도 시 reject된다', async () => {
    mock.onPatch('/todos/2').reply(403, { error: { code: 'FORBIDDEN' } })
    await expect(updateTodo(2, { title: '수정' })).rejects.toMatchObject({ response: { status: 403 } })
  })
})

describe('deleteTodo', () => {
  it('성공 시 resolve된다 (204)', async () => {
    mock.onDelete('/todos/1').reply(204)
    await expect(deleteTodo(1)).resolves.toBeUndefined()
  })

  it('올바른 URL로 요청한다', async () => {
    let capturedUrl: string | undefined
    mock.onDelete('/todos/5').reply((config) => {
      capturedUrl = config.url
      return [204]
    })
    await deleteTodo(5)
    expect(capturedUrl).toBe('/todos/5')
  })

  it('403 타인 소유 Todo 삭제 시도 시 reject된다', async () => {
    mock.onDelete('/todos/2').reply(403, { error: { code: 'FORBIDDEN' } })
    await expect(deleteTodo(2)).rejects.toMatchObject({ response: { status: 403 } })
  })
})

describe('toggleTodoComplete', () => {
  it('성공 시 토글된 Todo를 반환한다', async () => {
    const toggled = { ...mockTodo, is_completed: true }
    mock.onPatch('/todos/1/complete').reply(200, { data: toggled })
    const result = await toggleTodoComplete(1)
    expect(result.is_completed).toBe(true)
  })

  it('올바른 URL로 요청한다', async () => {
    let capturedUrl: string | undefined
    mock.onPatch('/todos/3/complete').reply((config) => {
      capturedUrl = config.url
      return [200, { data: { ...mockTodo, todo_id: 3, is_completed: true } }]
    })
    await toggleTodoComplete(3)
    expect(capturedUrl).toBe('/todos/3/complete')
  })
})
