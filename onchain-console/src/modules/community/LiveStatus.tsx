import { Card, CardHeader } from '@/components/Card'
import { Pill, PillTone } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { useLiveCommunity, freshness } from '@/data/liveSource'

const fmt = (n: number) => n.toLocaleString('ko-KR')

type Row = { ch: string; metric: string; state: '연동됨' | '준비 필요' | '수동'; value: string; note: string }

/**
 * 채널 연동 상태 — 실제 개설된 X·텔레그램이 콘솔에 붙었는지 보여 준다.
 * public/live/community.json 이 없으면 「미연동」으로 표시하고 실행 순서를 안내한다.
 */
export function LiveStatus() {
  const live = useLiveCommunity()

  if (live.status === 'loading') {
    return (
      <Card className="mb-4">
        <div className="px-5 py-4 text-meta text-mute">채널 연동 상태 확인 중…</div>
      </Card>
    )
  }

  if (live.status === 'none') {
    return (
      <Card className="mb-4">
        <CardHeader title="채널 연동 상태"
          badge={<Pill tone="warn">미연동</Pill>}
          formula={'public/live/community.json 이 있으면 실데이터로 전환됩니다.\n이 파일은 server/collect.mjs 가 생성합니다.'} />
        <div className="px-5 py-4">
          <p className="text-label leading-relaxed text-body">
            지금 화면의 수치는 <b className="font-semibold text-ink">전부 데모</b>입니다.
            X·텔레그램 채널은 개설되었으나 수집기가 아직 돌지 않았습니다.
          </p>
          <ol className="mt-3 space-y-2">
            {[
              ['봇을 채널·대화방 관리자로 추가', 'BotFather 토큰 발급 → server/.env 에 기입'],
              ['초대 링크 생성 — 가장 급함', 'node server/bootstrap-invites.mjs · 미리 안 나누면 유입원은 사후 복원 불가'],
              ['수집기 주기 실행', 'node server/collect.mjs · 크론 매시 정각 권장'],
              ['(선택) 웹훅 등록', '공개 HTTPS URL 필요 · 유입원 분해는 이게 있어야 채워집니다'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-2.5">
                <span className="num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy-soft text-tiny font-bold text-navy">{i + 1}</span>
                <span>
                  <span className="block text-label font-semibold text-ink">{t}</span>
                  <span className="num block text-meta leading-relaxed text-mute">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-line-soft pt-3 text-meta leading-relaxed text-mute">
            실행 순서 상세는 <b className="font-medium text-body">server/README.md</b>.
            토큰은 서버 환경변수로만 두며 브라우저로 나가지 않습니다 — 화면은 집계 결과 파일만 읽습니다.
          </p>
        </div>
      </Card>
    )
  }

  const d = live.data
  const f = freshness(d.generatedAt)
  const rows: Row[] = [
    {
      ch: '텔레그램', metric: '공지 채널 구독자',
      state: d.telegram.channel ? '연동됨' : '준비 필요',
      value: d.telegram.channel ? `${fmt(d.telegram.channel.members)}명` : '—',
      note: d.telegram.channel ? d.telegram.channel.title : '봇을 채널 관리자로 추가하세요',
    },
    {
      ch: '텔레그램', metric: '대화방 참여자',
      state: d.telegram.group ? '연동됨' : '준비 필요',
      value: d.telegram.group ? `${fmt(d.telegram.group.members)}명` : '—',
      note: d.telegram.group ? d.telegram.group.title : 'TELEGRAM_GROUP_ID 미설정',
    },
    {
      ch: '텔레그램', metric: '유입원 분해',
      state: d.telegram.sourcesAvailable ? '연동됨' : '준비 필요',
      value: d.telegram.sourcesAvailable ? `${d.telegram.sources.length}개 경로` : '—',
      note: d.telegram.sourcesAvailable ? '초대 링크별 가입 집계 중' : '웹훅 미가동 — chat_member 이벤트 필요',
    },
    {
      ch: 'X', metric: '팔로워',
      state: '수동',
      value: d.x.followers === null ? '—' : `${fmt(d.x.followers)}명`,
      note: '개별 관계 조회는 엔터프라이즈 전용 — 기여도는 x_profile 초대 링크로 측정',
    },
  ]
  const tone: Record<Row['state'], PillTone> = { 연동됨: 'ok', '준비 필요': 'warn', 수동: 'mute' }

  return (
    <Card className="mb-4">
      <CardHeader title="채널 연동 상태"
        badge={<Pill tone="ok">실데이터</Pill>}
        formula={'server/collect.mjs 가 생성한 public/live/community.json\n구독자 수는 스냅샷, 유입원은 초대 링크별 chat_member 집계'}
        action={
          <span className={`num text-meta ${f.stale ? 'text-warn' : 'text-mute'}`}>
            {f.stale && <Icon name="alert" size={12} className="mr-1 inline align-[-1px]" />}
            수집 {f.text}
          </span>
        } />
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[560px] text-label">
          <tbody>
            {rows.map(r => (
              <tr key={r.ch + r.metric} className="border-b border-line-soft last:border-0">
                <td className="px-5 py-2.5 text-meta font-semibold text-mute">{r.ch}</td>
                <td className="px-3 py-2.5 font-semibold text-ink">{r.metric}</td>
                <td className="num px-3 py-2.5 text-right font-bold text-ink">{r.value}</td>
                <td className="px-3 py-2.5"><Pill tone={tone[r.state]}>{r.state}</Pill></td>
                <td className="px-5 py-2.5 text-meta leading-relaxed text-mute">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {d.telegram.sources.length > 0 && (
        <div className="border-t border-line px-5 py-3">
          <div className="text-tiny font-semibold text-mute">실측 유입원</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {d.telegram.sources.map(s => (
              <span key={s.name} className="num rounded-full border border-line px-2.5 py-1 text-meta text-body">
                {s.label} <b className="font-bold text-navy">{fmt(s.count)}</b>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="border-t border-line bg-bg/50 px-5 py-3 text-meta leading-relaxed text-body">
        아래 KPI·차트는 아직 데모 데이터입니다. 실측 일수가 쌓이면 기간 필터가 의미를 갖기 시작합니다 —
        <b className="font-semibold text-navy"> 최소 7일</b>이 있어야 직전 동기간 비교가 성립합니다.
      </div>
    </Card>
  )
}
