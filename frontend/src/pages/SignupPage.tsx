import { SignupForm } from '../features/auth/components/SignupForm'

export function SignupPage() {
  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <section className="auth-copy" aria-label="TodoList overview">
          <span className="auth-kicker">TodoList Workspace</span>
          <h1 className="auth-headline">팀처럼 체계적으로 개인 일정을 정리하세요.</h1>
          <p className="auth-description">
            할일을 카테고리와 날짜로 연결하고, 캘린더와 대시보드에서 즉시 흐름을 확인할 수 있습니다.
          </p>
          <div className="auth-preview-grid" aria-hidden="true">
            <div className="auth-preview-card">
              <div className="auth-preview-label">Tasks</div>
              <div className="auth-preview-value">24</div>
            </div>
            <div className="auth-preview-card">
              <div className="auth-preview-label">Weekly</div>
              <div className="auth-preview-value">11</div>
            </div>
            <div className="auth-preview-card">
              <div className="auth-preview-label">Done</div>
              <div className="auth-preview-value">68%</div>
            </div>
          </div>
        </section>

        <section className="auth-card" aria-label="Signup form">
          <div className="auth-card-inner">
            <h2 className="auth-title">TodoList 가입하기</h2>
            <p className="auth-subtitle">업무 일정과 오늘 할일을 더 선명하게 관리할 계정을 만드세요.</p>
            <SignupForm />
          </div>
        </section>
      </div>
    </div>
  )
}
