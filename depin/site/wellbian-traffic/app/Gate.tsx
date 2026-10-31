/* 잠겨 있을 때(TRAFFIC_KEY 가 있을 때) 보이는 한 칸. 키는 POST 로 보낸다 — 주소창·방문 기록에 남지 않게. */
export default function Gate({ next, wrong }: { next: string; wrong?: boolean }) {
  return (
    <main className="wrap gate">
      <form method="post" action="/enter" className="gate-box">
        <b>wellbian 유입</b>
        <p>이 화면은 키가 있어야 열립니다. 받은 키를 넣어 주세요.</p>
        <input type="hidden" name="next" value={next} />
        <label className="gate-row">
          <span className="sr">접속 키</span>
          <input name="k" type="password" autoComplete="current-password" placeholder="접속 키" required autoFocus />
          <button type="submit" className="btn primary">열기</button>
        </label>
        {wrong && <p className="gate-err" role="alert">키가 맞지 않습니다. 다시 확인해 주세요.</p>}
      </form>
    </main>
  );
}
