// 어르신 상세 14탭 (요청서 7절 순서 그대로). 김순자는 채워진 예시, 나머지는 명부 요약.
// 정서·건강은 관찰 내용 · 변화 징후 · 추가 확인 필요로만 쓴다 — 진단명·점수 없음.
import { useState } from "react";
import { KV, Pill, Table, Tabs, Stamp, FeedPill, SevPill, Note, Empty, Btn } from "../ui";
import { VISITS, VISIT_STATE, visitPill, sevOf, maskTel, stampNow, OPERATOR } from "../../../lib/ops-mgmt";
import { HistoryTable } from "./EditLog";

const RANGES = ["최근 1시간", "오늘", "최근 7일", "최근 30일"];
const docTone = (s) => (s.startsWith("서명") ? "ok" : s.startsWith("갱신") || s.startsWith("확인") || s.startsWith("미서명") ? "warn" : "muted");
const roleTone = (r) => (r.startsWith("주") ? "navy" : r.startsWith("비상") ? "gold" : "info");
const input = "card-glass min-w-0 flex-1 rounded-[10px] px-3 py-2 text-[13px] text-navy outline-none focus:ring-1 focus:ring-gold";

function Sec({ title, right, children }) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-navy">{title}</h3>
        {right}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const num = (k, label) => ({ k, label, render: (r) => <span className="font-num">{r[k]}</span> });

export default function ElderTabs({ e, tab, onChange }) {
  const [range, setRange] = useState(1);
  const [memo, setMemo] = useState("");
  const visits = VISITS.filter((v) => v.name === e.name);
  const past = [{ id: "past-1", when: "08-19 14:00", team: `${e.branch} 팀`, memo: "8월 정기방문 · 21/21 · 검수 완료 · 보호자 열람", status: "done", followup: false }];

  switch (tab) {
    case "기본정보":
      return (
        <div>
          <KV k="이름" v={`${e.name} (${e.sex} · ${e.age}세 · ${e.born}년생)`} />
          <KV k="지점" v={e.branch} />
          <KV k="주소" v={`${e.addr} · 상세주소는 권한 열람`} />
          <KV k="거주형태" v={e.loc === "hospital" ? "요양병원" : "자택"} />
          <KV k="장애 정도" v={e.disability} />
          <KV k="보훈" v={e.veteran} />
          <KV k="장기요양" v={e.ltc} />
          <KV k="등록 · 서비스 시작" v={`${e.regDate} · ${e.service.since}`} mono />
          <KV k="서비스 상품" v={e.service.product} />
          <KV k="결제상태" v={e.service.pay} tone={e.service.pay.startsWith("정상") ? "ok" : "warn"} />
          <KV k="월 방문일정" v={`${e.service.visitDay} · ${e.service.cycle}`} />
          <KV k="긴급연락 우선순위" v={<ol className="list-decimal pl-4">{e.priority.map((p) => <li key={p}>{p}</li>)}</ol>} />
        </div>
      );
    case "건강·질환":
      return (
        <div>
          <KV k="주요 질환" v={<span className="flex flex-wrap gap-1">{e.health.dx.map((d) => <Pill key={d} tone="info">{d}</Pill>)}</span>} />
          <KV k="복용약" v={e.health.meds.join(" · ")} />
          <KV k="알레르기" v={e.health.allergy} />
          <KV k="주 이용 병원" v={e.health.hospital} />
          <KV k="관찰 메모" v={e.health.note} />
          <div className="mt-3"><Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다. 기록은 관찰 내용 · 변화 징후 · 추가 확인 필요로만 씁니다.</Note></div>
        </div>
      );
    case "보호자":
      return (
        <div>
          <Table
            dense
            cols={[
              { k: "name", label: "이름", render: (g) => <span className="font-bold text-navy">{g.name}</span> },
              { k: "rel", label: "관계" },
              { k: "role", label: "역할", render: (g) => <Pill tone={roleTone(g.role)}>{g.role}</Pill> },
              { k: "region", label: "거주" },
              num("tel", "연락"),
              { k: "consent", label: "수신동의", render: (g) => <span className="text-[11px] text-muted">{[g.consent.call && "전화", g.consent.sms && "문자", g.consent.push && "앱 푸시"].filter(Boolean).join(" · ") || "—"}</span> },
            ]}
            rows={e.guardians}
            rowKey={(g) => g.name}
            empty="연결된 보호자가 없습니다 — 상단 [보호자 연결]"
          />
          <div className="mt-2 text-[11px] text-muted">복수 보호자 연결 · 주·부·비상 우선순위 · 결제 권한 상세는 보호자 관리에서. 연결·변경은 상단 [보호자 연결] (확인 절차 · 이력 기록).</div>
        </div>
      );
    case "담당 컨시어지":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {[["주 담당", e.pri], ["부 담당", e.sub]].map(([r, n]) => (
            <div key={r} className="rounded-xl bg-navy/[.04] p-3">
              <div className="text-[11px] font-bold text-muted">{r}</div>
              <div className="mt-1 text-[15px] font-bold text-navy">{n === "—" ? <span className="text-gold">미배정</span> : n}</div>
              {n !== "—" && <div className="font-num text-[11px] text-muted">연락 {maskTel(n)} · {e.branch}</div>}
            </div>
          ))}
          <div className="text-[11px] text-muted sm:col-span-2">2인 1가구 짝 원칙 — 부 담당이 없으면 주 담당 부재 시 대체가 안 됩니다. 변경은 상단 [담당 컨시어지 변경] (확인 절차 · 이력 기록).</div>
        </div>
      );
    case "워치·센서": {
      const w = e.devices.watch;
      return (
        <div>
          <Sec title="워치" right={<FeedPill feed={w.feed} />}>
            <KV k="기기" v={`${w.model} · ${w.id}`} />
            <KV k="마지막 수신" v={<Stamp at={w.at} />} />
            <KV k="배터리 · 착용" v={`${w.battery} · ${w.worn}`} />
            <KV k="경보 임계값" v={w.threshold} tone={w.threshold.startsWith("개별") ? "info" : undefined} />
          </Sec>
          <Sec title="센서">
            <Table
              dense
              cols={[{ k: "type", label: "기기" }, { k: "place", label: "설치장소" }, { k: "at", label: "마지막 작동", render: (s) => <Stamp at={s.at} prefix="확인" /> }, { k: "state", label: "상태", render: (s) => <Pill tone={s.state === "정상" ? "ok" : "device"}>{s.state}</Pill> }]}
              rows={e.devices.sensors}
              rowKey={(s, i) => `${s.place}-${i}`}
            />
          </Sec>
          <div className="mt-2 text-[11px] text-muted">기기 등록 · 교체 · 장애이력은 웨어러블·센서 관리에서. 워치·센서 연결 변경은 [정보 수정] (사유 필수).</div>
        </div>
      );
    }
    case "건강 변화":
      return (
        <div>
          <Tabs tabs={RANGES.map((r, i) => [i, r])} value={range} onChange={setRange} />
          <div className="mt-2">
            <Table
              dense
              cols={[{ k: "m", label: "항목" }, { k: "v", label: RANGES[range], render: (r) => <span className="font-num font-bold text-navy">{r.vals[range]}</span> }, { k: "s", label: "수신", render: () => <Stamp at={e.devices.watch.at} /> }]}
              rows={e.trend.map((t) => ({ m: t[0], vals: t.slice(1) }))}
              rowKey={(r) => r.m}
            />
          </div>
          <div className="mt-2"><Note>변화 그래프 연동 대기 — 최근 1시간 · 오늘 · 최근 7일 · 최근 30일 단위. 값은 참고자료이며 의료진의 진단을 대신하지 않습니다.</Note></div>
        </div>
      );
    case "방문관리":
      return (
        <div>
          <KV k="방문 주기 · 일정" v={`${e.service.cycle} · ${e.service.visitDay}`} />
          <KV k="담당 2인 1조" v={`주 ${e.pri} · 부 ${e.sub === "—" ? "미배정" : e.sub}`} />
          <div className="mt-2">
            <Table
              dense
              cols={[
                { k: "when", label: "일시", render: (v) => <span className="font-num">{v.when || `09-22 ${v.time}`}</span> },
                { k: "team", label: "팀" },
                { k: "memo", label: "메모" },
                { k: "st", label: "상태", render: (v) => <Pill tone={VISIT_STATE[visitPill(v)].tone}>{VISIT_STATE[visitPill(v)].label}</Pill> },
              ]}
              rows={[...visits, ...past]}
              rowKey={(v) => v.id}
            />
          </div>
          <div className="mt-2 text-[11px] text-muted">21항목 점검 · 사진 · 보호자 리포트 · 관제 검수는 방문관리 메뉴에서 이어집니다.</div>
        </div>
      );
    case "해주세요":
      return e.requests.length ? (
        <Table dense cols={[num("at", "일자"), { k: "name", label: "서비스" }, { k: "price", label: "가격 (메뉴 기준)" }, { k: "state", label: "상태", render: (r) => <Pill tone="ok">{r.state}</Pill> }]} rows={e.requests} rowKey={(r, i) => `${r.at}-${i}`} />
      ) : (
        <Empty>최근 90일 해주세요 요청이 없습니다. 방문 중 발견한 일은 방문관리에서 서비스 전환으로 접수됩니다.</Empty>
      );
    case "함께해요": {
      const t = e.together;
      return (
        <div>
          <KV k="전담 케어매니저" v={t.manager} />
          <KV k="최근 대화" v={t.lastTalk} />
          <KV k="고객 관심사" v={t.interests} />
          <KV k="관찰된 정서상태" v={<ul className="list-disc pl-4">{t.observed.map((o) => <li key={o}>{o}</li>)}</ul>} />
          <KV k="약속사항" v={t.promise} />
          <KV k="다음 확인일" v={t.nextCheck} mono />
          <KV k="보호자 공유" v={t.shared} />
          <KV k="내부 비공개 메모" v={<span className="text-muted">{t.memo}</span>} />
          <div className="mt-3"><Note>정서상태는 진단이 아닙니다 — 관찰 내용 · 변화 징후 · 추가 확인 필요로만 기록합니다.</Note></div>
        </div>
      );
    }
    case "SOS·이상징후":
      return (
        <div>
          <KV k="현재 수신 상태" v={<span className="inline-flex items-center gap-2"><FeedPill feed={e.devices.watch.feed} /><Stamp at={e.devices.watch.at} /></span>} />
          <KV k="위험도" v={<SevPill sev={sevOf(e.risk)} />} />
          <div className="mt-2">
            {e.sos.length ? (
              <Table dense cols={[{ k: "no", label: "사건번호", render: (s) => <span className="font-num font-bold text-navy">{s.no}</span> }, num("at", "발생"), { k: "cause", label: "발생원인 · 측정값 · 기준값" }, { k: "result", label: "결과" }]} rows={e.sos} rowKey={(s) => s.no} />
            ) : (
              <Empty>최근 90일 SOS · 이상징후 사건이 없습니다.</Empty>
            )}
          </div>
        </div>
      );
    case "복지혜택":
      return <Table dense cols={[{ k: "name", label: "혜택" }, { k: "state", label: "상태", render: (w) => <Pill tone={w.state.includes("이용") ? "ok" : "info"}>{w.state}</Pill> }]} rows={e.welfare} rowKey={(w) => w.name} />;
    case "동의서·서류":
      return (
        <div>
          <Table dense cols={[{ k: "name", label: "서류" }, num("at", "일자"), { k: "state", label: "상태", render: (d) => <Pill tone={docTone(d.state)}>{d.state}</Pill> }]} rows={e.docs} rowKey={(d) => d.name} />
          <div className="mt-2 text-[11px] text-muted">긴급조치(119 신고 · 병원 이송) · 출입(도어락) 동의가 없으면 SOS 대응 시 현장 진입이 지연됩니다.</div>
        </div>
      );
    case "상담·관제메모":
      return (
        <div>
          <div className="flex gap-2">
            <input id={`memo-${e.name}`} aria-label="상담 · 관제메모" value={memo} onChange={(ev) => setMemo(ev.target.value)} placeholder="상담 · 관제 메모 (관찰 사실만)" className={input} />
            <Btn small disabled={!memo.trim()} onClick={() => { onChange((x) => ({ ...x, notes: [{ at: stampNow().slice(5), who: `${OPERATOR.name} (${OPERATOR.role})`, text: memo.trim() }, ...x.notes] })); setMemo(""); }}>메모 추가</Btn>
          </div>
          <ul className="mt-3 space-y-2">
            {e.notes.length === 0 && <li><Empty>상담 · 관제 메모가 없습니다.</Empty></li>}
            {e.notes.map((n, i) => (
              <li key={`${n.at}-${i}`} className="rounded-xl bg-navy/[.04] px-3 py-2 text-[12px]">
                <div className="flex justify-between text-[11px] text-muted"><span>{n.who}</span><span className="font-num">{n.at}</span></div>
                <div className="mt-0.5 text-ink">{n.text}</div>
              </li>
            ))}
          </ul>
        </div>
      );
    case "수정이력":
      return <HistoryTable rows={e.history} />;
    default:
      return null;
  }
}
