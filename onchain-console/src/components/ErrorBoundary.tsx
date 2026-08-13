import { Component, ReactNode } from 'react'
import { Icon } from './Icon'

type Props = { children: ReactNode; label?: string }
type State = { hasError: boolean }

/** 모듈 단위 에러 격리 — 한 모듈 장애가 콘솔 전체를 죽이지 않는다 (PRD §10) */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[360px] place-items-center rounded-card border border-line bg-panel shadow-card">
          <div className="text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-bad-soft text-bad">
              <Icon name="alert" size={20} />
            </span>
            <p className="mt-3 text-h3 text-ink">{this.props.label ?? '모듈'} 화면에 오류가 발생했습니다</p>
            <p className="mt-1 text-meta text-mute">다른 모듈은 정상 동작합니다. 새로고침 후에도 반복되면 감사 로그를 확인하세요.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
