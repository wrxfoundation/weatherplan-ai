// 웨어러블·센서 상세 탭 — 장비 현황 / 실시간 데이터 / 이벤트 타임라인 / 장애 이력 / 교체·회수 (요청서 10절).
import { Bar, Btn, Empty, FeedPill, KV, Note, Pill, Stamp, Table, TONE } from "../ui";
import { CAUSES, CAUSE_KEYS } from "../../../lib/ops-devices";
import { fmtAgo, fmtTime } from "../../../lib/ops-time";

// 워치 수신 상태 — 원인 코드가 있으면 그 원인으로, 없으면 경과시간으로 판정
export function watchFeed(dev) {
  if (dev.cause === "battery") return "battery";
  if (dev.cause === "unworn") return "unworn";
  const s = dev.watch.rxAgoSec;
  if (s > 7200) return "stale";
  if (s > 600 || (dev.cause && dev.cause !== "sensor_off")) return "delayed";
  return "live";
}

const stampOf = (now, agoSec) => (now && agoSec != null ? fmtTime(now - agoSec * 1000) : "—");

function WatchCard({ dev, now }) {
  const w = dev.watch;
  const feed = watchFeed(dev);
  const battTone = w.battery <= 10 ? "device" : w.battery <= 20 ? "warn" : "ok";
  return (
    <div className="card-glass rounded-xl p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted">기본 웨어러블</span>
        <span className="flex gap-1"><Pill tone="ok">필수 · 연결</Pill><FeedPill feed={feed} /></span>
      </div>
      <div className="mt-1 text-[16px] font-bold text-navy">{w.type}</div>
      <div className="mt-1">
        <KV k="기기 종류" v={`${w.type} (${w.model})`} />
        <KV k="기기번호" v={w.id} mono />
        <KV k="연결 고객" v={`${dev.name} · ${dev.age}세 · 담당 ${dev.concierge}`} />
        <KV k="등록일" v={w.registered} mono />
        <KV k="마지막 수신" v={<span><Stamp at={stampOf(now, w.rxAgoSec)} prefix="" /> <span className="text-muted">({now ? fmtAgo(w.rxAgoSec * 1000) : "—"})</span></span>} />
        <KV k="배터리" v={<span className="flex items-center gap-2"><span className="font-num w-[40px]" style={{ color: TONE[battTone].fg }}>{w.battery}%</span><span className="w-[120px]"><Bar value={w.battery} tone={battTone} /></span>{dev.cause === "battery" && <Pill tone="device">방전 추정</Pill>}</span>} />
        <KV k="펌웨어" v={w.firmware} mono />
        <KV k="통신상태" v={w.comm} tone={dev.cause && dev.cause !== "sensor_off" ? "device" : undefined} />
        <KV k="착용 여부" v={w.worn == null ? "확인 불가 (미수신)" : w.worn ? "착용 중" : "미착용"} tone={w.worn === false ? "device" : undefined} />
        <KV k="마지막 작동 확인" v={w.lastCheck} />
      </div>
    </div>
  );
}

function SensorSlots({ dev, now, onAdd }) {
  const slots = Array.from({ length: 10 }, (_, i) => dev.sensors.find((s) => s.slot === i + 1) || null);
  return (
    <div className="card-glass rounded-xl p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-navy">설치 센서 <span className="font-num">{dev.sensors.length} / 10</span>개</span>
        <Btn small onClick={onAdd} disabled={dev.sensors.length >= 10}>+ 센서 추가</Btn>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {slots.map((s, i) =>
          s ? (
            <div key={s.id} className="rounded-lg px-2 py-1.5" style={{ background: s.online ? TONE.ok.bg : TONE.device.bg }}>
              <div className="flex items-center justify-between text-[10px] font-bold text-muted"><span className="font-num">{String(i + 1).padStart(2, "0")}</span><span style={{ color: s.online ? TONE.ok.fg : TONE.device.fg }}>{s.online ? "온라인" : "오프라인"}</span></div>
              <div className="text-[12px] font-bold text-navy">{s.place} {s.type.startsWith("도어") ? "도어" : "mmWave"}</div>
              <div className="font-num text-[10px] text-muted">{stampOf(now, s.rxAgoSec)}</div>
            </div>
          ) : (
            <div key={`empty-${i}`} className="rounded-lg border border-dashed border-navy/[.15] px-2 py-1.5 text-center font-num text-[11px] text-muted">빈 슬롯 {String(i + 1).padStart(2, "0")}</div>
          )
        )}
      </div>
      {dev.sensors.length > 0 && (
        <div className="mt-3">
          <Table
            dense
            cols={[
              { k: "slot", label: "슬롯", w: 44, render: (s) => <span className="font-num">{String(s.slot).padStart(2, "0")}</span> },
              { k: "type", label: "기기 종류", render: (s) => `${s.type} (${s.model})` },
              { k: "id", label: "기기번호", render: (s) => <span className="font-num">{s.id}</span> },
              { k: "place", label: "설치장소" },
              { k: "registered", label: "등록일", render: (s) => <span className="font-num">{s.registered}</span> },
              { k: "rx", label: "마지막 수신", render: (s) => <Stamp at={stampOf(now, s.rxAgoSec)} prefix="" /> },
              { k: "power", label: "배터리·전원" },
              { k: "firmware", label: "펌웨어", render: (s) => <span className="font-num">{s.firmware}</span> },
              { k: "online", label: "통신상태", render: (s) => <Pill tone={s.online ? "ok" : "device"} dot>{s.online ? "온라인" : "오프라인"}</Pill> },
              { k: "lastCheck", label: "마지막 작동 확인" },
            ]}
            rows={dev.sensors}
          />
        </div>
      )}
    </div>
  );
}

export function DevicesTab({ dev, now, onAdd }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
      <div className="lg:col-span-2"><WatchCard dev={dev} now={now} /></div>
      <div className="lg:col-span-3"><SensorSlots dev={dev} now={now} onAdd={onAdd} /></div>
    </div>
  );
}

export function RealtimeTab({ dev, now }) {
  const rt = dev.realtime;
  const tiles = [["hr", "심박수"], ["spo2", "산소포화도"], ["resp", "호흡수 (센서)"], ["motion", "움직임 (센서)"]];
  const feed = watchFeed(dev);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
        <span>실시간 수신 데이터 · <Stamp at={now ? fmtTime(now) : "—"} prefix="기준" /></span>
        <FeedPill feed={feed} />
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {tiles.map(([k, label]) => {
          const f = rt[k];
          return (
            <div key={k} className="rounded-xl px-3 py-2.5" style={{ background: TONE[f.tone].bg }}>
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-muted"><span>{label}</span><span style={{ color: TONE[f.tone].fg }}>{f.note}</span></div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-num text-[26px] font-bold leading-none" style={{ color: TONE[f.tone].fg }}>{f.v}</span>
                <span className="text-[12px] font-semibold text-muted">{f.unit || f.place}</span>
              </div>
              <div className="mt-1"><Stamp at={stampOf(now, f.agoSec)} prefix="측정" /></div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-5">
        <div className="rounded-xl px-3 py-2.5 lg:col-span-2" style={{ background: dev.diagnosis ? TONE.warn.bg : TONE.ok.bg, boxShadow: dev.diagnosis ? `inset 0 0 0 1px ${TONE.warn.bar}66` : undefined }}>
          <div className="text-[11px] font-bold" style={{ color: dev.diagnosis ? TONE.warn.fg : TONE.ok.fg }}>{dev.diagnosis ? "진단 필요" : "이상 없음"}</div>
          <div className="mt-0.5 text-[13px] font-semibold text-ink">{dev.diagnosis || "모든 장비가 정상 수신 중입니다."}</div>
        </div>
        <div className="card-glass rounded-xl px-3 py-2.5 lg:col-span-3">
          <div className="text-[11px] font-bold text-muted">수신 이상 원인 분류 — “미수신” 하나로 뭉개지 않습니다</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CAUSE_KEYS.map((k) => {
              const on = dev.cause === k;
              return <Pill key={k} tone={on ? CAUSES[k].tone : "muted"} dot={on} className={on ? "" : "opacity-60"}>{CAUSES[k].label}</Pill>;
            })}
          </div>
          <div className="mt-1.5 text-[12px] text-muted">{dev.cause ? `현재 판정: ${CAUSES[dev.cause].label}` : "현재 수신 이상 없음"}</div>
        </div>
      </div>
      <Note>센서 호흡수는 참고값입니다. 건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.</Note>
    </div>
  );
}

export function TimelineTab({ dev, now }) {
  const events = [...dev.timeline].sort((a, b) => a.agoSec - b.agoSec);
  if (events.length === 0) return <Empty>이벤트가 없습니다.</Empty>;
  return (
    <div>
      <div className="text-[12px] text-muted">갤럭시워치와 mmWave 센서 이벤트를 한 시간축에 — 최신순</div>
      <ol className="mt-2 divide-y divide-navy/[.06]">
        {events.map((e, i) => (
          <li key={`${e.agoSec}-${i}`} className="flex items-center gap-3 py-2 text-[13px]">
            <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: TONE[e.tone].bar }} aria-hidden />
            <span className="font-num w-[76px] shrink-0 text-[12px] text-muted">{stampOf(now, e.agoSec)}</span>
            <Pill tone={e.src === "워치" ? "navy" : "info"}>{e.src}</Pill>
            <span className="min-w-0 flex-1 text-ink">{e.text}</span>
            <span className="text-[11px] font-bold" style={{ color: TONE[e.tone].fg }}>{e.tone === "danger" ? "위험" : e.tone === "warn" ? "주의" : e.tone === "device" ? "기기" : "정상"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FaultsTab({ dev }) {
  return (
    <Table
      dense
      cols={[
        { k: "at", label: "발생 일시", w: 130, render: (r) => <span className="font-num text-[12px]">{r.at}</span> },
        { k: "device", label: "장비" },
        { k: "cause", label: "원인", render: (r) => <Pill tone={CAUSES[r.cause]?.tone || "muted"}>{CAUSES[r.cause]?.label || r.cause}</Pill> },
        { k: "desc", label: "내용" },
        { k: "action", label: "조치" },
        { k: "state", label: "상태", render: (r) => <Pill tone={r.state === "해결" ? "ok" : "warn"}>{r.state}</Pill> },
      ]}
      rows={dev.faults.map((f, i) => ({ ...f, id: `${f.at}-${i}` }))}
      empty="장애 이력이 없습니다."
    />
  );
}

export function SwapsTab({ dev }) {
  return (
    <Table
      dense
      cols={[
        { k: "at", label: "일시", w: 100, render: (r) => <span className="font-num text-[12px]">{r.at}</span> },
        { k: "device", label: "장비", render: (r) => <span className="font-num">{r.device}</span> },
        { k: "type", label: "구분", render: (r) => <Pill tone={r.type === "회수" ? "muted" : r.type === "교체" ? "warn" : "ok"}>{r.type}</Pill> },
        { k: "from", label: "이전" },
        { k: "to", label: "이후" },
        { k: "reason", label: "사유" },
        { k: "by", label: "처리자" },
      ]}
      rows={dev.swaps.map((s, i) => ({ ...s, id: `${s.at}-${i}` }))}
      empty="교체·회수 이력이 없습니다."
    />
  );
}
