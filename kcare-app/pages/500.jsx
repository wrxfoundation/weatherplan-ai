import ErrorPage from "../components/ErrorPage";

export default function ServerError() {
  return (
    <ErrorPage
      code="500"
      title="화면을 그리지 못했습니다"
      desc="일시적인 문제일 수 있습니다. 다시 시도하거나 데모 홈으로 돌아가 주세요."
      onRetry={() => window.location.reload()}
    />
  );
}
