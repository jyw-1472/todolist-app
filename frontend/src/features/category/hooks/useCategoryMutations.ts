import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCategory, deleteCategory } from '../../../api/category.api'
import { CATEGORIES_QUERY_KEY } from './useCategoryList'
import type { CreateCategoryRequest } from '../types/category.types'

const TODOS_QUERY_KEY = ['todos'] as const

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: number) => deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    },
  })
}
