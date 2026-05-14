import { useState } from 'react'
import type { AxiosError } from 'axios'
import { Input } from '../../../components/Input'
import { Button } from '../../../components/Button'
import { useCreateCategory } from '../hooks/useCategoryMutations'
import { getErrorMessage } from '../../../utils/errorMessage'
import type { ApiError } from '../../../types/api.types'

function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ error: ApiError }>
  const code = axiosError?.response?.data?.error?.code
  return getErrorMessage(code ?? '')
}

export function CategoryForm() {
  const [name, setName] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const createCategory = useCreateCategory()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setLocalError('카테고리 이름을 입력해주세요.')
      return
    }
    setLocalError(null)
    createCategory.mutate(
      { name: name.trim() },
      { onSuccess: () => setName('') }
    )
  }

  const serverError = createCategory.error ? extractErrorMessage(createCategory.error) : null
  const errorMessage = localError ?? serverError

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Input
        label="새 카테고리 이름"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setLocalError(null)
          if (createCategory.error) createCategory.reset()
        }}
        placeholder="예: 업무, 개인, 프로젝트"
        error={errorMessage ?? undefined}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" isLoading={createCategory.isPending}>
          추가
        </Button>
      </div>
    </form>
  )
}
