import { SubHeader } from "@/components/chrome";
import { Check, XIcon, TgIcon, Book, Mail } from "@/components/icons";
import { LINKS, MOCK_ORDER } from "@/lib/data";

/* 1g 배송 대기 (데스크톱) + 1l (모바일 세로 타임라인) — PRD §3, §6.3 (8/26 개정:
   지갑 주소 = 구매 증명(별도 주문 코드 없음). 배송 접수는 발송 2주 전부터 공지되는 별도
   폼에서 지갑 주소·성함·연락처·배송지만 접수, 배송 후 파기) */

const STEPS = ["결제 확인", "배송 접수", "발송 · 송장", "완료"];

function StepCircleH({ i }: { i: number }) {
  if (i === 0)
    return (
      <span style={{ width: 34, height: 34, borderRadius: 99, background: "var(--w-main)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={16} color="currentColor" w={3} />
      </span>
    );
  if (i === 1)
    return (
      <span style={{ width: 34, height: 34, borderRadius: 99, border: "2.5px solid var(--w-main)", background: "#fff", color: "var(--w-main)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
        2
      </span>
    );
  return (
    <span style={{ width: 34, height: 34, borderRadius: 99, border: "2px solid var(--bd-card)", background: "#fff", color: "var(--dis)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
      {i + 1}
    </span>
  );
}

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = { ...MOCK_ORDER, id: decodeURIComponent(orderId) };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <SubHeader right={<span style={{ fontSize: 12.5, color: "var(--cap)" }}>주문 조회 · {order.id}</span>} />

      <main className="wl-sec-pad" style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", background: "linear-gradient(var(--panel), #fff)" }}>
        {/* 헤드: 체크 + 제네시스 배정 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center" }}>
          <span style={{ width: 64, height: 64, borderRadius: 99, background: "var(--w-tint)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={30} color="var(--w-main)" w={3} />
          </span>
          <h2 className="big-title" style={{ fontWeight: 800, color: "var(--w-deep)" }}>
            제네시스 넘버 <span style={{ color: "var(--w-main)" }}>#{order.genesisNo}</span>가 배정되었습니다
          </h2>
          <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--ink-4)", flexWrap: "wrap", justifyContent: "center" }}>
            <span>주문번호 <b style={{ color: "var(--ink-2)" }}>{order.id}</b></span>
            <span>트랜잭션 <a href="#tx" className="mono" style={{ fontSize: 12 }}>{order.txHash} ↗</a></span>
            <span>예상 배송 <b style={{ color: "var(--ink-2)" }}>2026년 10월 순차 발송</b></span>
          </div>
        </div>

        {/* 가로 4스텝 (데스크톱) */}
        <div className="order-steps-h" style={{ display: "grid", gridTemplateColumns: "repeat(7, auto)", alignItems: "center", gap: 10 }}>
          {STEPS.map((t, i) => (
            <div key={t} style={{ display: "contents" }}>
              {i > 0 && <span style={{ width: 60, height: 2, background: i === 1 ? "var(--w-main)" : "var(--bd-card)" }} />}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 120 }}>
                <StepCircleH i={i} />
                <span style={{ fontSize: 12.5, fontWeight: i <= 1 ? 800 : 400, color: i === 0 ? "var(--w-deep)" : i === 1 ? "var(--w-main)" : "var(--hint)" }}>{t}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 세로 타임라인 (모바일, 1l) */}
        <div className="order-steps-v" style={{ display: "flex", flexDirection: "column", gap: 0, alignSelf: "stretch" }}>
          {STEPS.map((t, i) => (
            <div key={t} style={{ display: "flex", gap: 12, alignItems: i === 3 ? "center" : "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {i === 0 ? (
                  <span style={{ width: 26, height: 26, borderRadius: 99, background: "var(--w-main)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Check size={13} color="currentColor" />
                  </span>
                ) : i === 1 ? (
                  <span style={{ width: 26, height: 26, borderRadius: 99, border: "2.5px solid var(--w-main)", background: "#fff", color: "var(--w-main)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flex: "none" }}>2</span>
                ) : (
                  <span style={{ width: 26, height: 26, borderRadius: 99, border: "2px solid var(--bd-card)", background: "#fff", color: "var(--dis)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flex: "none" }}>{i + 1}</span>
                )}
                {i < 3 && <span style={{ width: 2, height: 22, background: i === 0 ? "var(--w-main)" : "var(--bd-card)" }} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: i <= 1 ? 800 : 400, color: i === 0 ? "var(--w-deep)" : i === 1 ? "var(--w-main)" : "var(--hint)", marginTop: i === 3 ? 0 : 4 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* 기다리는 동안 */}
        <div className="w720" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-deep)", textAlign: "center" }}>기다리는 동안</div>
          <div className="rl-grid" style={{ gap: 12 }}>
            <a href={LINKS.x} target="_blank" rel="noopener" className="btn-ghost" style={{ padding: 15, fontSize: 13.5, textDecoration: "none" }}>
              <XIcon size={14} /> X 팔로우
            </a>
            <a href={LINKS.telegram} target="_blank" rel="noopener" className="btn-main" style={{ padding: 15, fontSize: 13.5, textDecoration: "none", color: "#fff" }}>
              <TgIcon size={15} /> 텔레그램 입장
            </a>
            <a href="/#setup" className="btn-ghost" style={{ padding: 15, fontSize: 13.5, textDecoration: "none" }}>
              <Book size={15} /> 연동 가이드 미리보기
            </a>
          </div>
        </div>

        {/* 구매 증명(지갑 주소) · 접수 방식 · 환불 안내 */}
        <div className="w720" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: "1.5px solid var(--w-main)", background: "var(--w-tint)", borderRadius: 12, padding: "15px 18px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", color: "var(--w-main)" }}>구매 증명 — 지갑 주소</span>
              <span className="mono" style={{ fontSize: 17, fontWeight: 800, color: "var(--w-deep)" }}>{order.wallet}</span>
            </div>
            <span style={{ fontSize: 12, lineHeight: 1.6, color: "var(--ink-4)", maxWidth: 330 }}>
              결제에 사용한 <b style={{ color: "var(--w-deep)" }}>지갑 주소가 곧 구매 증명</b>입니다 — 별도 코드 없이, 배송 접수 폼에 이 주소를 입력하면 됩니다.
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, border: "1px solid var(--bd-card)", borderRadius: 12, padding: "14px 18px", fontSize: 13, lineHeight: 1.7, color: "var(--ink-4)", alignItems: "flex-start" }}>
            <span style={{ flex: "none", marginTop: 2 }}><Mail size={16} /></span>
            <span>
              <b style={{ color: "var(--ink-2)" }}>배송 접수는 이렇게 진행됩니다.</b> 디바이스 발송 2주 전부터 공식 텔레그램·X로 접수 폼을 알려드립니다 → 폼에 <b style={{ color: "var(--ink-2)" }}>지갑 주소 · 성함 · 연락처 · 배송지</b>를 입력하면 순서대로 발송합니다. 배송에 필요한 정보만 받고, <b style={{ color: "var(--ink-2)" }}>배송이 끝나면 파기</b>합니다. 정품 등록용 리딤코드는 박스 안 카드에 있습니다.
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, border: "1px solid var(--bd-card)", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--ink-4)", flexWrap: "wrap" }}>
            <span>환불 가능 기간 — 제품 수령일부터 7일 이내 (리딤코드 사용 전)</span>
            <span className="pill" style={{ fontSize: 12, color: "var(--w-deep)", background: "var(--chip)", padding: "4px 12px" }}>수령 후 카운트다운 시작</span>
          </div>
        </div>
      </main>
    </div>
  );
}
