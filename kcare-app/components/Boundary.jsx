import { Component } from "react";
import ErrorPage from "./ErrorPage";

// 렌더 예외 방어막 — 한 화면이 터져도 흰 화면 대신 한글 안내가 뜨게 한다.
// 시연 중 사고 방지가 목적이라, 복구는 "다시 시도" 한 번으로 단순하게 둔다.
// 클래스 컴포넌트인 이유: componentDidCatch는 아직 훅으로 대체할 수 없다.
export default class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // 개인정보가 섞일 수 있으므로 콘솔까지만 — 외부로 보내지 않는다
    if (process.env.NODE_ENV !== "production") console.error(error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <ErrorPage
        code="오류"
        title="화면을 그리지 못했습니다"
        desc="이 화면에서 문제가 생겼습니다. 다시 시도하거나 데모 홈으로 돌아가 주세요."
        onRetry={() => this.setState({ failed: false })}
      />
    );
  }
}
