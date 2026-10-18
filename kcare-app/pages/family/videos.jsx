import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Line } from "../../components/clay";
import { Card, Sheet, SheetTitle, TONE, WhiteBtn } from "../../components/ds";
import { VIDEO_RETENTION_DAYS, VISIT_VIDEOS } from "../../lib/mock";
import { VIDEO_POLICY, VIDEO_SEGMENTS } from "../../lib/console";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { videoConsentOf } from "../../lib/consent";

// 마이 › 방문 영상 (2026-10-15 디자인 시안) — 안심방문 바디캠 영상 (2026-09-04 시트 보호자 마이 2번).
// 규칙: 30일 보관 후 자동 삭제 · 분쟁이 생기면 관리자가 보관 기간을 따로 정한다 · 찍지 않는 곳을 화면에 밝힌다.
// 베타는 영상을 받지 않는다 — 테스트 가구 · 센터 공간에는 예시 영상을 보이지 않는다 (2026-10-06 UX 점검).
// 실제 영상은 서버 연동 뒤에 붙는다 — 재생 창은 구간(챕터)과 보관 상태만 보여 준다.
const LOOKS = [TONE.purple, TONE.beige, TONE.green];

export default function VideosPage() {
  const { state } = useAppState();
  const live = !!useAuth().user?.household;
  const consent = videoConsentOf(state); // 정보 동의 철회 · 가입 상담 값 · 기본(동의) 순 — lib/consent.js
  const [video, setVideo] = useState(null);
  // 30일이 지난 것은 목록에서 빠진다 — 관리자가 보관을 지정한 건만 남는다
  const list = VISIT_VIDEOS.map((v) => ({ ...v, left: VIDEO_RETENTION_DAYS - v.daysAgo })).filter((v) => v.left > 0 || v.hold);
  const dateOf = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

  return (
    <>
      <Head>
        <title>방문 영상 — K-CARE</title>
      </Head>
      <FamilyLayout
        back="/family/my"
        backLabel="마이로 돌아가기"
        sub="마이"
        title="방문 영상"
        action={
          <span className="ds-gchip flex-none" style={{ background: TONE.purple.bg, color: TONE.purple.fg }}>
            {VIDEO_RETENTION_DAYS}일 보관
          </span>
        }
      >
        {live ? (
          <Card tone="stone" shadow={false} pad={18} className="ds-r text-[16px] leading-[1.7]" style={{ "--d": "40ms" }}>
            아직 받은 영상이 없습니다 — 베타 테스트에서는 바디캠 영상을 올리지 않습니다.
          </Card>
        ) : !consent ? (
          <Card tone="stone" shadow={false} pad={18} className="ds-r text-[16px] leading-[1.7]" style={{ "--d": "40ms" }}>
            가입 때 방문기록 영상 촬영에 동의하지 않으셨습니다. 동의는 정보 동의에서 언제든 바꿀 수 있고, 바꾼 뒤 방문부터 영상이 남습니다.
          </Card>
        ) : (
          <ul className="ds-r m-0 flex list-none flex-col gap-3 p-0" style={{ "--d": "40ms" }}>
            {list.map((v, i) => {
              const tn = LOOKS[i % LOOKS.length];
              const soon = !v.hold && v.left <= 3;
              return (
                <li key={v.id}>
                  <button type="button" onClick={() => setVideo(v)} className="ds-tap flex w-full items-center gap-3.5 rounded-[24px] p-3.5 text-left" style={{ background: tn.bg }}>
                    <span aria-hidden="true" className="flex h-[52px] w-[70px] flex-none items-center justify-center rounded-[14px] text-white" style={{ background: tn.solid }}>
                      <Line name="play" size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[17px] font-extrabold leading-[1.3]">{v.title}</b>
                      <span className="block text-[14px] leading-[1.4]" style={{ color: tn.sub }}>
                        {dateOf(v.daysAgo)} · {v.by} · {v.len}
                      </span>
                    </span>
                    <span className="flex-none rounded-full bg-white px-2.5 py-1 text-[13px] font-extrabold" style={{ color: v.hold || soon ? TONE.gold.fg : "#3A3F50" }}>
                      {v.hold ? "보관 연장" : `D-${v.left} 삭제`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="ds-r flex items-center gap-2.5 rounded-[20px] px-4 py-3" style={{ "--d": "80ms", background: TONE.beige.bg, color: "#5E4A1E" }}>
          <Line name="noCam" size={22} />
          <span className="text-[15px] font-extrabold">{VIDEO_POLICY.banned.join(" · ")}은 찍지 않아요</span>
        </div>
        <p className="ds-r px-1 text-[13px] leading-[1.7]" style={{ "--d": "100ms", color: "#5E6270" }}>
          {VIDEO_RETENTION_DAYS}일 보관 후 자동 삭제됩니다. 분쟁이 생기면 관리자가 보관 기간을 따로 정합니다. 열람은 접근 기록에 남습니다.
        </p>

        {video && <VideoSheet video={video} onClose={() => setVideo(null)} />}
      </FamilyLayout>
    </>
  );
}

// 영상 재생 창 — 실제 영상은 서버 연동 뒤에 붙는다. 구간(챕터)과 보관 상태만 보여 준다.
function VideoSheet({ video, onClose }) {
  const [seg, setSeg] = useState(0);
  return (
    <Sheet label={`${video.title} 영상`} onClose={onClose}>
      <SheetTitle sub={`${video.by} · ${video.len}`} title={video.title} />
      <span className="self-start rounded-full px-3 py-1 text-[13px] font-extrabold" style={video.hold ? { background: TONE.gold.bg, color: TONE.gold.fg } : { background: "#EEEDEA", color: "#5E5A52" }}>
        {video.hold ? `보관 ${video.hold.until}` : `D-${video.left} 자동 삭제`}
      </span>
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-[20px] text-white" style={{ background: "linear-gradient(135deg,#2A3558,#1B2340)" }}>
        <Line name="play" size={40} />
        <div className="text-[15px] font-bold">{VIDEO_SEGMENTS[seg]}</div>
        <span className="rounded-full px-3 py-1 text-[12px] font-extrabold" style={{ background: "rgba(255,255,255,.14)" }}>
          영상 서버 연동 대기 · 데모
        </span>
      </div>
      <div role="group" aria-label="구간" className="grid grid-cols-2 gap-2">
        {VIDEO_SEGMENTS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeg(i)}
            aria-pressed={seg === i}
            className="ds-press min-h-[48px] rounded-[14px] px-3 text-left text-[14px] font-extrabold"
            style={seg === i ? { background: "#1B2340", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#3A3F50", boxShadow: "0 3px 0 #E3DED3" }}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
      {video.hold && (
        <p className="rounded-[16px] px-3.5 py-3 text-[14px] leading-[1.6]" style={{ background: TONE.gold.bg, color: "#5A4A22" }}>
          보관 연장 — {video.hold.why}. 지정한 날짜가 지나면 삭제됩니다.
        </p>
      )}
      <p className="text-[13px] leading-[1.7]" style={{ color: "#5E6270" }}>
        열람은 접근 기록에 남습니다. {VIDEO_POLICY.retention}
      </p>
      <WhiteBtn className="text-[16px]" onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}
