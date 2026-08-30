/* 사람이 볼 화면은 없다. 주소를 잘못 찾아온 사람에게 여기가 무엇인지만 알린다. */
export default function Page() {
  return (
    <main className="wrap" style={{ paddingTop: 56 }}>
      <h1 style={{ fontSize: 19, fontWeight: 800 }}>wellbian FAQ bot</h1>
      <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>
        텔레그램 웹훅 엔드포인트입니다.
      </p>
      <p style={{ marginTop: 10, fontSize: 14 }}>
        <a href="https://t.me/wellbiantalk">t.me/wellbiantalk</a>
      </p>
    </main>
  );
}
