import { LoginForm } from '../features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <section className="auth-copy" aria-label="TodoList overview">
          <span className="auth-kicker">할일 목록 앱</span>
          <h1 className="auth-headline">일정과 오늘 할일을 한 화면에서 관리하세요.</h1>
          <p className="auth-description">
            캘린더, 빠른 추가, 진행률, 카테고리 통계를 연결해 매일의 업무 흐름을 더 명확하게 정리합니다.
          </p>
          <div className="auth-preview-grid" aria-hidden="true">
            <div className="auth-preview-card">
              <div className="auth-preview-label">Today</div>
              <div className="auth-preview-value">08</div>
            </div>
            <div className="auth-preview-card">
              <div className="auth-preview-label">Progress</div>
              <div className="auth-preview-value">72%</div>
            </div>
            <div className="auth-preview-card">
              <div className="auth-preview-label">Calendar</div>
              <div className="auth-preview-value">May</div>
            </div>
          </div>
        </section>

        <section className="auth-card" aria-label="Login form">
          <div className="auth-card-inner">
            <h2 className="auth-title">TodoList 로그인</h2>
            <p className="auth-subtitle">캘린더, 오늘 할일, 일정 관리를 한 화면에서 관리하세요.</p>
            <LoginForm />
          </div>
        </section>
      </div>
    </div>
  )
}
