export interface Category {
  category_id: number
  user_id: number | null
  name: string
  is_default: boolean
}

export interface CreateCategoryRequest {
  name: string
}
