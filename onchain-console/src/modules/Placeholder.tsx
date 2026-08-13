import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'

export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-h1 text-ink">{title}</h1>
        <Pill tone="demo">DEMO</Pill>
      </div>
      <Card className="grid min-h-[420px] place-items-center">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-navy-soft text-navy">
            <Icon name="sliders" size={22} />
          </span>
          <p className="mt-4 text-h3 text-ink">{description}</p>
          <p className="mt-1.5 text-meta text-mute">PRD Phase 순서에 따라 구현 예정입니다. 시안이 확정되면 이 화면에 반영됩니다.</p>
        </div>
      </Card>
    </>
  )
}
