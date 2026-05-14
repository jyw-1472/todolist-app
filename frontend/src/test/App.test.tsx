import { describe, it, expect } from 'vitest'
import { queryClient } from '../App'

describe('App — QueryClient 설정', () => {
  it('staleTime이 30000으로 설정되어 있다', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(30000)
  })

  it('retry가 1로 설정되어 있다', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.retry).toBe(1)
  })
})
