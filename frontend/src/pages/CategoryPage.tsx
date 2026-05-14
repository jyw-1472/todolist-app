import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { CategoryList } from '../features/category/components/CategoryList'
import { CategoryForm } from '../features/category/components/CategoryForm'
import { useCategoryList } from '../features/category/hooks/useCategoryList'
import { useDeleteCategory } from '../features/category/hooks/useCategoryMutations'
import { useLogout } from '../features/auth/hooks/useAuth'
import { getErrorMessage } from '../utils/errorMessage'
import type { Category } from '../features/category/types/category.types'
import type { ApiError } from '../types/api.types'

type DeleteModal = { type: 'none' } | { type: 'confirm'; category: Category }

function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ error: ApiError }>
  const code = axiosError?.response?.data?.error?.code
  return getErrorMessage(code ?? '')
}

export function CategoryPage() {
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ type: 'none' })
  const [deleteErrors, setDeleteErrors] = useState<Record<number, string>>({})

  const { data: categories = [], isLoading } = useCategoryList()
  const deleteCategory = useDeleteCategory()
  const { mutate: logout } = useLogout()

  const systemCount = categories.filter((category) => category.is_default || category.user_id === null).length
  const customCount = categories.length - systemCount

  function handleDeleteRequest(category: Category) {
    setDeleteErrors((prev) => {
      const next = { ...prev }
      delete next[category.category_id]
      return next
    })
    setDeleteModal({ type: 'confirm', category })
  }

  function handleDeleteConfirm() {
    if (deleteModal.type !== 'confirm') return
    const { category } = deleteModal
    deleteCategory.mutate(category.category_id, {
      onSuccess: () => {
        setDeleteModal({ type: 'none' })
      },
      onError: (error) => {
        setDeleteModal({ type: 'none' })
        const message = extractErrorMessage(error)
        setDeleteErrors((prev) => ({ ...prev, [category.category_id]: message }))
      },
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <span className="brand-title">TodoList</span>
            <span className="brand-subtitle">업무 흐름에 맞게 할일 분류 체계를 관리합니다.</span>
          </div>
          <Button variant="secondary" onClick={() => logout()}>
            로그아웃
          </Button>
        </div>
      </header>

      <main className="page-container">
        <section className="page-hero">
          <div>
            <p className="section-kicker">Workspace</p>
            <h1 className="page-title">카테고리 관리</h1>
            <p className="page-description">
              기본 카테고리와 사용자 카테고리를 정리해 캘린더와 할일 카드의 구분감을 높입니다.
            </p>
          </div>
          <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', marginBottom: 0, minWidth: '280px' }}>
            <article className="summary-card" style={{ minHeight: '92px' }}>
              <span className="summary-label">전체</span>
              <strong className="summary-value">{categories.length}</strong>
            </article>
            <article className="summary-card" style={{ minHeight: '92px' }}>
              <span className="summary-label">사용자</span>
              <strong className="summary-value">{customCount}</strong>
            </article>
          </div>
        </section>

        <div className="settings-grid">
          <section className="settings-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">새 카테고리</h2>
                <p className="panel-subtitle">프로젝트, 업무 유형, 개인 일정 등을 추가하세요.</p>
              </div>
            </div>
            <CategoryForm />
          </section>

          <section className="settings-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">카테고리 목록</h2>
                <p className="panel-subtitle">기본 {systemCount}개, 사용자 {customCount}개</p>
              </div>
            </div>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spinner />
              </div>
            ) : (
              <CategoryList
                categories={categories}
                deleteErrors={deleteErrors}
                onDeleteRequest={handleDeleteRequest}
              />
            )}
          </section>
        </div>
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {[
            { to: '/', label: '일정 캘린더' },
            { to: '/categories', label: '카테고리' },
            { to: '/profile', label: '프로필' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className={`nav-link ${to === '/categories' ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <Modal
        isOpen={deleteModal.type === 'confirm'}
        onClose={() => setDeleteModal({ type: 'none' })}
        title="카테고리 삭제"
      >
        {deleteModal.type === 'confirm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
              "{deleteModal.category.name}" 카테고리를 삭제하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => setDeleteModal({ type: 'none' })}
                disabled={deleteCategory.isPending}
              >
                취소
              </Button>
              <Button
                variant="danger"
                isLoading={deleteCategory.isPending}
                onClick={handleDeleteConfirm}
              >
                삭제
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
