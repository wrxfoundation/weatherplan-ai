import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta, DownloadButton } from '@/components/PageHeader'
import { Donut, MultiLineChart } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { m7Demo as d, channelBadge } from '@/demo/generators/m7'

function ChannelDot({ ch }: { ch: string }) {
  const b = channelBadge[ch]
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: b.bg }}>
      {b.label}
    </span>
  )
}

export function M7Page() {
  return (
    <>
      <PageHeader
        title="M7 소셜 & 미디어"
        subtitle="소셜 채널 현황과 미디어 성과를 한눈에 확인하세요."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={<DownloadButton />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} formula={k.formula}
            value={k.value} delta={k.delta} deltaLabel="vs 지난 7일" spark={k.spark} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1.35fr_1.25fr]">
        <Card>
          <CardHeader title="채널별 팔로워 현황" formula={'채널별 팔로워 수 / 총 팔로워\n일 1회 스냅샷'} />
          <div className="flex flex-col items-center gap-4 px-5 sm:flex-row sm:gap-5 pb-5">
            <Donut size={168} thickness={30} centerTop="TOTAL" centerBottom={d.channels.total} centerSub="Followers"
              segments={d.channels.segments.map(s => ({ value: s.value, color: s.color }))} />
            <div className="w-full flex-1 space-y-2">
              {d.channels.segments.map(s => (
                <div key={s.key} className="flex items-center justify-between gap-2 whitespace-nowrap text-tiny font-normal">
                  <span className="flex items-center gap-1.5 text-body">
                    {s.key === 'etc'
                      ? <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      : <ChannelDot ch={s.key} />}
                    {s.label}
                  </span>
                  <span className="num font-semibold text-ink">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={<>참여 트렌드 <span className="font-medium text-mute">(최근 7일)</span></>} />
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 px-5 pb-1 text-tiny text-mute">
            <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-navy" /> 참여 수</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-ok" /> 조회 수</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-[#8F7BE8]" /> 공유 수</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-warn" /> 댓글 수</span>
          </div>
          <div className="px-4 pb-4">
            <MultiLineChart height={228} w={520}
              yTicks={d.engagement.yTicks} yFmt={v => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)} xLabels={d.engagement.days}
              seriesList={[
                { data: d.engagement.joins, color: '#3E6FE0', dots: true },
                { data: d.engagement.views, color: '#2FA870', dots: true },
                { data: d.engagement.shares, color: '#8F7BE8', dots: true },
                { data: d.engagement.comments, color: '#E08A2E', dots: true },
              ]} />
          </div>
        </Card>

        <Card>
          <CardHeader title="인기 게시물 TOP 5"
            action={<GhostButton>7일 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">순위</th>
                  <th className="px-2 py-2 font-medium">게시물</th>
                  <th className="px-2 py-2 font-medium">채널</th>
                  <th className="px-2 py-2 text-right font-medium">조회 수</th>
                  <th className="px-2 py-2 text-right font-medium">참여 수</th>
                </tr>
              </thead>
              <tbody>
                {d.topPosts.map(p => (
                  <tr key={p.rank} className="border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label font-semibold text-mute">{p.rank}</td>
                    <td className="max-w-[180px] truncate whitespace-nowrap px-2 py-2.5 text-label font-medium text-ink">{p.title}</td>
                    <td className="px-2 py-2.5"><ChannelDot ch={p.ch} /></td>
                    <td className="num whitespace-nowrap px-2 py-2.5 text-right text-label text-body">{p.views}</td>
                    <td className="num whitespace-nowrap px-2 py-2.5 text-right text-label text-body">{p.joins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 게시물 보기 →</FooterLinkButton>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1.35fr_1.25fr]">
        <Card>
          <CardHeader title={<>채널별 성과 요약 <span className="font-medium text-mute">(최근 7일)</span></>} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">채널</th>
                  <th className="px-2 py-2 text-right font-medium">팔로워 증가</th>
                  <th className="px-2 py-2 text-right font-medium">게시물 수</th>
                  <th className="px-2 py-2 text-right font-medium">조회 수</th>
                  <th className="px-2 py-2 text-right font-medium">참여율</th>
                </tr>
              </thead>
              <tbody>
                {d.channelPerf.map(c => (
                  <tr key={c.ch} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-2 text-label font-medium text-ink"><ChannelDot ch={c.ch} />{c.name}</span>
                    </td>
                    <td className="num px-2 py-2.5 text-right text-label font-semibold text-ok">{c.growth}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{c.posts}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{c.views}</td>
                    <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{c.engage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>채널별 상세 분석 보기 →</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="해시태그 성과 TOP 5"
            action={<GhostButton>7일 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">순위</th>
                  <th className="px-2 py-2 font-medium">해시태그</th>
                  <th className="px-2 py-2 text-right font-medium">게시물 수</th>
                  <th className="px-2 py-2 text-right font-medium">조회 수</th>
                  <th className="px-2 py-2 text-right font-medium">참여 수</th>
                </tr>
              </thead>
              <tbody>
                {d.hashtags.map(h => (
                  <tr key={h.rank} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label font-semibold text-mute">{h.rank}</td>
                    <td className="px-2 py-2.5 text-label font-semibold text-navy">{h.tag}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{h.posts}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{h.views}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{h.joins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 해시태그 분석 보기 →</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="최근 미디어 언급"
            action={<button type="button" className="text-meta font-medium text-navy hover:underline">전체 보기</button>} />
          <div className="space-y-1.5 px-4">
            {d.media.map(m => (
              <div key={m.title} className="flex items-center gap-2.5 rounded-lg border border-line-soft px-2.5 py-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: m.color }}>{m.initial}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate whitespace-nowrap text-label text-ink">
                    <b className="mr-1.5 font-semibold">{m.outlet}</b>
                    <span className="text-body">{m.title}</span>
                  </span>
                </span>
                <span className="num shrink-0 text-tiny font-normal text-mute">{m.date.slice(5)}</span>
                <Pill tone={m.tone === '긍정' ? 'ok' : 'mute'}>{m.tone}</Pill>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 미디어 언급 보기 →</FooterLinkButton>
          </div>
        </Card>
      </div>
    </>
  )
}
