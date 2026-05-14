import axiosInstance from './axiosInstance'
import type { Category, CreateCategoryRequest } from '../features/category/types/category.types'

export async function getCategories(): Promise<Category[]> {
  const response = await axiosInstance.get<{ data: Category[] }>('/categories')
  return response.data.data
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const response = await axiosInstance.post<{ data: Category }>('/categories', data)
  return response.data.data
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await axiosInstance.delete(`/categories/${categoryId}`)
}
