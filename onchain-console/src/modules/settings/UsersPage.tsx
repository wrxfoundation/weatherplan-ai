import { useState } from 'react'
import { Card, GhostButton } from '@/components/Card'
import { KpiCard, KpiTone } from '@/components/KpiCard'
import { PageHeader } from '@/components/PageHeader'
import { Pill, PillTone } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { Avatar } from '@/components/Toggle'
import { usersDemo as d, rosterColors } from '@/demo/generators/settings'

export function UsersPage() {
  const [tab, setTab] = useState('활동 내역')

  return (
    <>
      <PageHeader
        title="사용자 관리"
        subtitle="시스템 사용자 계정 및 권한을 관리하고 활동을 모니터링합니다. (v1 권한: viewer · operator · admin — 아래는 확장 운영 데모)"
        actions={
          <>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-label font-semibold text-white hover:bg-navy-deep transition-colors">+ 사용자 추가</button>
            <GhostButton><Icon name="gear" size={14} /> 권한 그룹 관리</GhostButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex flex-wrap items-center gap-2 px-5 py-3">
            <label className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-label text-mute focus-within:border-navy/50">
              <Icon name="search" size={14} />
              <input placeholder="이름 / 이메일 / ID 검색" className="w-44 bg-transparent text-label text-ink outline-none placeholder:text-mute" />
            </label>
            <GhostButton>전체 권한 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
            <GhostButton>전체 상태 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
            <GhostButton>더보기 필터</GhostButton>
            <span className="ml-auto flex items-center gap-1.5 text-mute">
              <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:text-navy" aria-label="새로고침"><Icon name="refresh" size={14} /></button>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-navy bg-navy-soft text-navy-deep" aria-label="리스트 보기"><Icon name="registry" size={14} /></button>
            </span>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="whitespace-nowrap text-left text-meta font-medium text-mute">
                  <th className="py-2.5 pl-5 pr-3 font-medium">사용자</th>
                  <th className="px-3 py-2.5 font-medium">역할 / 권한</th>
                  <th className="px-3 py-2.5 font-medium">권한 그룹</th>
                  <th className="px-3 py-2.5 font-medium">상태</th>
                  <th className="px-3 py-2.5 font-medium">마지막 로그인</th>
                  <th className="px-3 py-2.5 font-medium">2FA</th>
                  <th className="py-2.5 pl-3 pr-4 text-right font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {d.users.map(u => (
                  <tr key={u.email} className="whitespace-nowrap border-t border-line-soft transition-colors hover:bg-navy-tint/60">
                    <td className="py-3 pl-5 pr-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.name} size={30} color={rosterColors[u.name]} />
                        <span>
                          <span className="flex items-center gap-1.5 text-label font-semibold text-ink">
                            {u.name} {u.me && <Pill tone="navy">나</Pill>}
                          </span>
                          <span className="num block text-tiny font-normal text-mute">{u.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block text-label font-medium text-ink">{u.role}</span>
                      <span className="block text-tiny font-normal text-mute">{u.roleSub}</span>
                    </td>
                    <td className="px-3 py-3"><Pill tone={u.groupTone as PillTone}>{u.group}</Pill></td>
                    <td className="px-3 py-3"><Pill tone={u.active ? 'ok' : 'mute'}>{u.active ? '활성' : '비활성'}</Pill></td>
                    <td className="num px-3 py-3 text-label text-body">{u.login}</td>
                    <td className="px-3 py-3">
                      {u.tfa
                        ? <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-ok-soft text-ok"><Icon name="audit" size={11} strokeWidth={2.2} /></span>
                        : <span className="text-label text-mute">—</span>}
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-mute">
                        <button type="button" className="hover:text-navy" aria-label="보기"><Icon name="eye" size={14} /></button>
                        <button type="button" className="hover:text-navy" aria-label="더보기"><Icon name="dots" size={14} /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="num text-meta text-mute">전체 28명 중 1-8 표시</span>
            <div className="flex items-center gap-1">
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute" aria-label="이전"><Icon name="chevronLeft" size={13} /></button>
              {[1, 2, 3, 4].map(p => (
                <button key={p} type="button" className={`num h-7 w-7 rounded-md border text-meta font-semibold ${p === 1 ? 'border-navy bg-navy-soft text-navy-deep' : 'border-line text-body'}`}>{p}</button>
              ))}
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute" aria-label="다음"><Icon name="chevronRight" size={13} /></button>
            </div>
            <GhostButton>10 / 페이지 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-h2 text-ink">사용자 상세 정보</h2>
            <button type="button" className="text-mute hover:text-navy" aria-label="닫기"><Icon name="chevronRight" size={15} /></button>
          </div>
          <div className="flex items-center gap-3 px-5 pt-4">
            <Avatar name={d.detail.name} size={44} color={rosterColors[d.detail.name]} />
            <div>
              <div className="flex items-center gap-2 text-h3 text-ink">{d.detail.name} <Pill tone="navy">{d.detail.role}</Pill></div>
              <div className="num text-meta text-mute">{d.detail.email}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-line-soft px-5 pt-4">
            {d.detail.rows.map(r => (
              <div key={r.label} className="flex items-center justify-between text-label">
                <span className="text-mute">{r.label}</span>
                <b className={`num font-semibold ${r.tone ?? 'text-ink'}`}>{r.value}</b>
              </div>
            ))}
          </div>
          <div className="px-4 pt-4">
            <button type="button" className="w-full rounded-lg border border-line px-3 py-2 text-label font-medium text-body hover:border-navy/40 hover:text-navy transition-colors">사용자 정보 수정</button>
          </div>
          <div className="mt-4 flex gap-1 border-b border-line px-5">
            {d.detail.tabs.map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`relative whitespace-nowrap px-2.5 pb-2 text-label transition-colors ${
                  tab === t ? 'font-bold text-navy' : 'font-medium text-mute hover:text-body'}`}>
                {t}
                {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-navy" />}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between px-5 pt-3">
            <span className="text-label font-semibold text-ink">활동 내역</span>
            <button type="button" className="text-meta font-medium text-navy hover:underline">전체 보기</button>
          </div>
          <div className="space-y-3 px-5 py-3 pb-5">
            {d.detail.activity.map(a => (
              <div key={a.at} className="flex gap-2.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-white" style={{ background: a.color }}>
                  <Icon name={a.icon} size={12} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <b className="text-label font-semibold text-ink">{a.title}</b>
                    <span className="num shrink-0 text-tiny font-normal text-mute">{a.at}</span>
                  </span>
                  <span className="block text-tiny font-normal leading-relaxed text-mute">{a.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
