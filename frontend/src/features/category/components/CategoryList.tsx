import type { Category } from '../types/category.types'

interface CategoryListProps {
  categories: Category[]
  deleteErrors: Record<number, string>
  onDeleteRequest: (category: Category) => void
}

export function CategoryList({ categories, deleteErrors, onDeleteRequest }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-title">등록된 카테고리가 없습니다.</div>
        <p>새 카테고리를 만들어 할일을 더 명확하게 정리해보세요.</p>
      </div>
    )
  }

  const isSystemCategory = (category: Category) => category.is_default || category.user_id === null
  const defaultList = categories.filter(isSystemCategory)
  const userList = categories.filter((category) => !isSystemCategory(category))

  function renderItem(category: Category) {
    return (
      <div key={category.category_id}>
        <div className="todo-card" style={{ alignItems: 'center' }}>
          <div className="todo-content">
            <p className="todo-title">{category.name}</p>
            <div className="todo-meta">
              <span className="meta-pill">
                {isSystemCategory(category) ? '기본 카테고리' : '사용자 카테고리'}
              </span>
            </div>
          </div>
          {isSystemCategory(category) ? (
            <span className="meta-pill">기본</span>
          ) : (
            <button
              type="button"
              onClick={() => onDeleteRequest(category)}
              aria-label={`삭제: ${category.name}`}
              className="icon-button danger-button"
              style={{ width: 'auto', padding: '0 10px' }}
            >
              삭제
            </button>
          )}
        </div>
        {deleteErrors[category.category_id] && (
          <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginTop: '6px', paddingLeft: '4px' }}>
            {deleteErrors[category.category_id]}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="settings-stack">
      {defaultList.length > 0 && (
        <section>
          <p className="section-kicker" style={{ marginBottom: '10px' }}>기본 카테고리</p>
          <div className="todo-stack">{defaultList.map(renderItem)}</div>
        </section>
      )}
      {userList.length > 0 && (
        <section>
          <p className="section-kicker" style={{ marginBottom: '10px' }}>사용자 카테고리</p>
          <div className="todo-stack">{userList.map(renderItem)}</div>
        </section>
      )}
    </div>
  )
}
