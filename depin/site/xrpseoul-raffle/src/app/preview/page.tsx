import PreviewGallery from "./PreviewGallery";

export const metadata = { title: "결제창 미리보기 - XRP SEOUL 2026 래플", robots: { index: false, follow: false } };

/* /preview - 결제창(응모 → 동의 → XRP 결제 → NFT 수령) 단계별 화면을 정적으로 나열한다. 정본에 붙이는 사람이 흐름을 보는 용도. */
export default function PreviewPage() {
  return <PreviewGallery />;
}
