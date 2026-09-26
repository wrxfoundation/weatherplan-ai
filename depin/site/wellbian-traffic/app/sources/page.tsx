/* 소스별 일자 — 세션 소스 × 날짜 (9/26 서우 — "일자별 세션 소스 별로 보고싶은데 아니면 rawdata 다운로드
   가능하게 해줄래" → "텔레봇 말고 그냥 스핀오프해서 하위 페이지 만들어서")

   GA 「트래픽 획득: 세션 소스」 표를 날짜로 펼친다 — 줄 = 세션 소스, 칸 = 그날 그 소스에서 시작된 세션.
   표는 app/SourceDays.tsx, 집계는 lib/source-daily.ts, 호출은 lib/ga.ts 의 gaSourceDaily(5분 캐시). */
import { redirect } from "next/navigation";
import Nav from "../Nav";
import Gate from "../Gate";
import SourceDays from "../SourceDays";
import { NotConnected, ReadError } from "../Problem";
import { gaSourceDaily, gaReady } from "@/lib/ga";
import { passed, gated } from "@/lib/gate";
import { dayLabel } from "@/lib/traffic";
import { pivotSources } from "@/lib/source-daily";

export const dynamic = "force-dynamic";
export const metadata = { title: "소스별 일자" };

export default async function Sources({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (sp.k) redirect(`/enter?k=${encodeURIComponent(sp.k)}&next=/sources`);
  if (!(await passed())) return <Gate next="/sources" wrong={sp.e === "1"} />;

  const sd = await gaSourceDaily();
  const day = sd.error ? null : pivotSources(sd.rows, sd.since, sd.today);
  const first = day?.cols[0]?.key;
  const ago = Math.max(0, Math.round((Date.now() - sd.fetchedAt) / 60000));

  return (
    <>
      <Nav current="sources" sub={`wellbian.io · GA4 · ${sd.since} 부터 · 5분마다 갱신`} />
      <main className="wrap" style={{ paddingBottom: 72 }}>
        <h1 className="rep-h" style={{ marginTop: 4 }}>소스별 일자 — 세션 소스 × 날짜</h1>
        <p className="rep-sub">
          GA 「트래픽 획득: 세션 소스」 표를 날짜로 펼쳤습니다. 줄이 세션 소스(GA 화면과 같은 이름)이고, 칸의 숫자가 그날 그 소스에서
          시작된 세션입니다. 조회는 {sd.since} 부터{first ? <>이고 첫 유입이 {dayLabel(first)} 이라 표는 그날부터 그립니다</> : null}.
          날짜별 합은 GA 화면 합계보다 조금 클 수 있습니다(자정을 넘긴 세션은 이틀에 한 번씩 셉니다).
        </p>

        <div className="tf-dl" aria-label="내려받기">
          <span className="tf-dl-k">원자료</span>
          <a className="xl" href="/export?f=xlsx" download>엑셀 파일(.xlsx) — 원자료 · 이 표 · 개요 표 전부</a>
          <a href="/export?t=raw" download>원자료 CSV</a>
          <a href="/export?t=srcdaily" download>이 표 CSV(일별)</a>
          <span className="tf-dl-n">원자료 = 날짜 × 소스 × 매체 × 캠페인 한 줄에 세션 · 참여 세션 · 참여율 · 사용자 · 신규 · 이벤트 · 세션당 이벤트 · 평균 참여 시간 · 주요 이벤트 · 총수익. 한글이 깨지면 엑셀 파일이나 <a href="/export?t=raw&f=csv16" download>유니코드 CSV</a></span>
        </div>

        <div style={{ marginTop: 12 }}>
          {!gaReady() ? <NotConnected /> : sd.error || !day ? <ReadError msg={sd.error ?? "empty"} /> : <SourceDays day={day} today={sd.today} />}
        </div>
        {!sd.error && !sd.full && (
          <p className="tf-foot" style={{ marginTop: 8 }}>
            주요 이벤트 · 총수익 열은 비어 있습니다{gated() && sd.note ? <> — <span className="mono">{sd.note}</span></> : "."}
          </p>
        )}

        <div className="tf-note">
          <b>원자료로 할 수 있는 것과 없는 것</b>
          <ul>
            <li>원자료는 GA 가 API 로 줄 수 있는 가장 잘게 쪼갠 값입니다 — 날짜 × 소스 × 매체 × 캠페인. 비율(참여율 · 세션당 이벤트 · 평균 참여 시간)은 그 줄의 합으로 다시 계산해 GA 화면과 같은 정의입니다.</li>
            <li>방문 한 건 한 건의 기록(이벤트 로그)은 API 로 나오지 않습니다. 필요하면 GA 관리 › 제품 링크 › <b>BigQuery 링크</b>를 켭니다 — 켠 날부터 매일 쌓이고 지난 기간은 채워지지 않습니다.</li>
            <li><b>주요 이벤트 · 총수익</b>이 0 이면 구매 완료가 GA 에서 주요 이벤트로 표시돼 있지 않은 것입니다. 표시해야 어느 소스가 결제로 이어졌는지 보입니다.</li>
            <li>프로모 코드(예: PIXIE-F811)나 채널 핸들(pixie)만 붙은 링크는 매체가 비어 들어옵니다. 이 표는 그런 소스를 KOL 로 묶어 색을 칠합니다(채널 칩 「KOL」).</li>
          </ul>
        </div>

        <p className="tf-foot">
          {ago === 0 ? "방금" : `${ago}분 전에`} GA4 에서 읽음 · 5분마다 새로 읽습니다 · 기준 시간 한국
        </p>
      </main>
    </>
  );
}
