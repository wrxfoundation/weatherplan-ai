/* FAQ·일정 정본 배급 (8/30 서우 — 텔레그램 봇을 별도 Vercel 프로젝트로 분리하면서 신설)

   봇이 다른 프로젝트로 나가면 lib/data.ts 를 import 로 읽을 수 없다. 그렇다고 FAQ 를
   봇 쪽에 복사하면 정본이 둘이 된다 — 8/29 에 정확히 그 사고가 났다. 화면 문구는 새 정책으로
   고쳤는데 사본이 남아 있던 /api/inventory 와 public/*.docx 가 옛 정책(추첨·차수 가격·100대)을
   계속 대외로 내보내고 있었다. 그래서 사본 대신 이 엔드포인트를 둔다: 정본은 여전히
   lib/data.ts · lib/schedule.ts 하나뿐이고, 봇은 그것을 읽어가기만 한다.

   여기서 나가는 값은 전부 이미 사이트 화면에 떠 있는 것들이다(FAQ 본문·판매 일정·고지 문구).
   8/29 에 막은 /api/inventory 와 다른 점이 그것이다 — 그쪽은 미공개 값(내부 단계명·차수 가격·
   재고 수량)을 인증 없이 내보내고 있었다. 화면에 없는 값을 이 응답에 추가하지 말 것.

   phase 는 요청 시각에 따라 달라지므로 s-maxage 60초로만 캐시한다. 1분 오차는
   9/7·9/15 같은 정오·18시 경계에서도 문제가 되지 않는다(봇도 자체 캐시 60초를 둔다). */

import { FAQ } from "@/lib/faq-source";
import { MILESTONES, phaseAt, nextMilestone } from "@/lib/schedule";
import { D } from "@/lib/dict";

/* 프리렌더되면 phase 가 빌드 시각에 얼어붙는다 — 매 요청 계산하고 캐시는 CDN 에 맡긴다 */
export const dynamic = "force-dynamic";

/** 봇은 KO·EN 만 쓴다. 5개 언어 전부 보내면 응답이 불필요하게 커진다. */
const loc = (m: { ko: string; en?: string }) => ({ ko: m.ko, en: m.en ?? m.ko });

const MS_LABEL = {
  reserveOpen: D.msReserveOpen,
  reserveClose: D.msReserveClose,
  priorityOpen: D.msPriorityOpen,
  generalOpen: D.msGeneralOpen,
  saleEnd: D.msSaleEnd,
} as const;

const PHASE_LABEL = {
  before_reserve: D.phaseBeforeReserve,
  reserve_open: D.phaseReserveOpen,
  reserve_closed: D.phaseReserveClosed,
  priority_window: D.phasePriorityWindow,
  general_window: D.phaseGeneralWindow,
  closed: D.phaseClosed,
} as const;

export function GET() {
  const now = Date.now();
  const nx = nextMilestone(now);
  const phase = phaseAt(now);

  const body = {
    /* 봇이 계약 변경을 알아챌 수 있게 둔다. 응답 모양을 바꾸면 올린다. */
    contract: 1,
    faq: FAQ,
    schedule: {
      title: loc(D.scheduleTitle),
      name: loc(D.launchName),
      nextStepIn: loc(D.nextStepIn),
      milestones: MILESTONES.map((m) => ({
        key: m.key,
        at: m.at,
        label: loc(MS_LABEL[m.key]),
        /* 일반 구매창은 "예정"이다 — 조기 오픈 가능성을 라벨과 늘 함께 보낸다 */
        ...(m.key === "generalOpen" ? { note: loc(D.msGeneralNote) } : {}),
      })),
      phase,
      phaseLabel: loc(PHASE_LABEL[phase]),
      next: nx ? { key: nx.key, at: nx.at } : null,
      /* 일정만 떼어 말하면 "가격도 정해졌다"로 읽힌다 — 고지를 정본에서 같이 내보낸다 */
      notices: [loc(D.priceTbd), loc(D.reserveNotGuaranteed)],
    },
  };

  return Response.json(body, {
    headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
