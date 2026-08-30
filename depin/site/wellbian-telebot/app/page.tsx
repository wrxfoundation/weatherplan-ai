/* 사람이 볼 화면은 없다. 주소를 잘못 찾아온 사람에게 여기가 무엇인지만 알린다. */
export default function Page() {
  return (
    <main style={{ padding: 40, lineHeight: 1.7, color: "#333" }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>wellbian FAQ bot</h1>
      <p style={{ marginTop: 8, color: "#666" }}>
        Telegram webhook endpoint. Nothing to see here.
      </p>
      <p style={{ marginTop: 8 }}>
        <a href="https://t.me/wellbiantalk">t.me/wellbiantalk</a>
      </p>
    </main>
  );
}
