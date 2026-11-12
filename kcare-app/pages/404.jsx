import ErrorPage from "../components/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="없는 화면입니다"
      desc="주소가 바뀌었거나 없는 화면입니다. 처음 화면에서 다시 들어가 주세요."
    />
  );
}
