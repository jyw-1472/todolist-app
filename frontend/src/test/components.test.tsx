import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Spinner } from '../components/Spinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { Badge } from '../components/Badge'

describe('Button', () => {
  it('children 텍스트를 렌더링한다', () => {
    render(<Button>저장</Button>)
    expect(screen.getByText('저장')).toBeInTheDocument()
  })

  it('variant=primary 버튼이 렌더링된다', () => {
    render(<Button variant="primary">확인</Button>)
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })

  it('variant=secondary 버튼이 렌더링된다', () => {
    render(<Button variant="secondary">취소</Button>)
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('variant=danger 버튼이 렌더링된다', () => {
    render(<Button variant="danger">삭제</Button>)
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('isLoading=true이면 버튼이 비활성화된다', () => {
    render(<Button isLoading>저장</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('isLoading=true이면 스피너가 표시된다', () => {
    render(<Button isLoading>저장</Button>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('disabled=true이면 클릭 핸들러가 호출되지 않는다', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>버튼</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('onClick 핸들러가 호출된다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('Input', () => {
  it('label이 렌더링된다', () => {
    render(<Input label="이메일" />)
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
  })

  it('error가 없으면 에러 메시지가 표시되지 않는다', () => {
    render(<Input label="이메일" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('error 메시지가 하단에 표시된다', () => {
    render(<Input label="이메일" error="이메일 형식이 올바르지 않습니다." />)
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 형식이 올바르지 않습니다.')
  })

  it('error가 있으면 input에 aria-invalid=true가 설정된다', () => {
    render(<Input label="비밀번호" error="필수 항목입니다." />)
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('aria-invalid', 'true')
  })

  it('에러가 없으면 aria-invalid가 false이다', () => {
    render(<Input label="이름" />)
    expect(screen.getByLabelText('이름')).toHaveAttribute('aria-invalid', 'false')
  })
})

describe('Spinner', () => {
  it('로딩 중 aria-label로 렌더링된다', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: '로딩 중' })).toBeInTheDocument()
  })

  it('size prop에 따라 렌더링된다', () => {
    const { rerender } = render(<Spinner size="sm" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    rerender(<Spinner size="lg" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('ErrorMessage', () => {
  it('message가 null이면 렌더링하지 않는다', () => {
    render(<ErrorMessage message={null} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('message가 있으면 텍스트를 렌더링한다', () => {
    render(<ErrorMessage message="서버 오류가 발생했습니다." />)
    expect(screen.getByRole('alert')).toHaveTextContent('서버 오류가 발생했습니다.')
  })
})

describe('Badge', () => {
  it('isCompleted=true이면 "완료"를 표시한다', () => {
    render(<Badge isCompleted />)
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('isCompleted=false이면 "미완료"를 표시한다', () => {
    render(<Badge isCompleted={false} />)
    expect(screen.getByText('미완료')).toBeInTheDocument()
  })
})

describe('Modal', () => {
  it('isOpen=false이면 렌더링하지 않는다', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="테스트">내용</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('isOpen=true이면 모달이 표시된다', () => {
    render(<Modal isOpen onClose={vi.fn()} title="할일 추가">내용</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('할일 추가')).toBeInTheDocument()
    expect(screen.getByText('내용')).toBeInTheDocument()
  })

  it('× 버튼 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="테스트">내용</Modal>)
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('배경 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="테스트">내용</Modal>)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('모달 내부 클릭 시 onClose가 호출되지 않는다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="테스트">내용</Modal>)
    fireEvent.click(screen.getByText('내용'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ESC 키 입력 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="테스트">내용</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('isOpen=false이면 ESC 키가 동작하지 않는다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={false} onClose={onClose} title="테스트">내용</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
