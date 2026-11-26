// 관제가 보호자 정보를 바꿨다는 알림 (2026-10-28 업데이트 요청 4) — 보호자 홈 · 마이 위쪽.
// 연락 수신동의 · 야간 연락은 본인 동의 항목이라, 관제가 바꾸면 무엇이 어떻게 · 왜 바뀌었는지 그대로 보인다.
// [확인했어요]를 누르면 내려간다 (가구 기록 state.guardianNotices · lib/state.js guardianNoticeSeen)
import { Clay } from "./clay";
import { TONE, WhiteBtn } from "./ds";
import { useAppState } from "../lib/state";
import { guardianNoticesFor } from "../lib/ops-records";

const when = (t) => new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export default function GuardianNotices({ me }) {
  const { state, dispatch } = useAppState();
  const list = guardianNoticesFor(state, me);
  if (!list.length) return null;
  return list.map((n) => (
    <div key={n.id} className="flex flex-col gap-3 rounded-[24px] p-4" style={{ background: TONE.gold.bg, boxShadow: `0 5px 0 ${TONE.gold.sh}` }}>
      <div className="flex items-center gap-3.5">
        <Clay name="shieldBlue" size={44} />
        <span className="min-w-0 flex-1">
          <b className="block text-[17px] font-extrabold" style={{ color: TONE.gold.title }}>
            관제가 연락 수신동의를 바꿨어요
          </b>
          <span className="text-[14px]" style={{ color: TONE.gold.sub }}>
            {when(n.at)} · {n.by || "관제"}
          </span>
        </span>
      </div>
      <p className="rounded-[16px] bg-white px-3.5 py-3 text-[15px] leading-[1.6]" style={{ color: "#3A3F50" }}>
        {n.text}
        {n.reason && (
          <span className="mt-1 block text-[14px]" style={{ color: "#5E6270" }}>
            사유 — {n.reason}
          </span>
        )}
      </p>
      <p className="text-[14px] leading-[1.55]" style={{ color: TONE.gold.sub }}>
        요청하신 적이 없으면 K-CARE 고객센터로 알려 주세요.
      </p>
      <WhiteBtn className="text-[16px] font-extrabold" onClick={() => dispatch({ type: "guardianNoticeSeen", id: n.id, by: me })}>
        확인했어요
      </WhiteBtn>
    </div>
  ));
}
