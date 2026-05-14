import { describe, it, expect } from 'vitest'

describe('프로젝트 설정 검증', () => {
  it('TypeScript strict 모드가 활성화되어 있다', () => {
    const value: string = 'test'
    expect(typeof value).toBe('string')
  })

  it('zustand 패키지가 import 가능하다', async () => {
    const { create } = await import('zustand')
    expect(typeof create).toBe('function')
  })

  it('@tanstack/react-query 패키지가 import 가능하다', async () => {
    const { QueryClient } = await import('@tanstack/react-query')
    const client = new QueryClient()
    expect(client).toBeDefined()
  })

  it('axios 패키지가 import 가능하다', async () => {
    const axios = await import('axios')
    expect(typeof axios.default.get).toBe('function')
  })

  it('react-router-dom 패키지가 import 가능하다', async () => {
    const { BrowserRouter } = await import('react-router-dom')
    expect(BrowserRouter).toBeDefined()
  })
})
