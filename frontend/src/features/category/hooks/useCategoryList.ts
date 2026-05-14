import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../../../api/category.api'

export const CATEGORIES_QUERY_KEY = ['categories'] as const

export function useCategoryList() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: getCategories,
  })
}
