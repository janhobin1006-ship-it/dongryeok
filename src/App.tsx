import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import { campaign, categories, team, type Pledge, type Feasibility } from './data/site'

const allPledges = categories.flatMap((c) => c.pledges.map((p) => ({ ...p, cat: c.name, catId: c.id })))
const filled = (p: Pledge) => [p.why, p.how, p.effect].filter(Boolean).length
const doneCount = allPledges.filter((p) => filled(p) === 3).length

function Pending({ children = '작성 중' }: { children?: string }) {
  return <span className="text-muted/70 italic">{children}</span>
}

function Header() {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 -mx-[max(16px,env(safe-area-inset-left,0px))] border-b border-line bg-bg/90 px-[max(16px,env(safe-area-inset-left,0px))] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4">
        <a href="#top" className="font-display text-xl text-fg">동력</a>
        <nav className="flex gap-5 text-sm text-muted">
          <a href="#why" className="hover:text-fg">출마의 변</a>
          <a href="#pledges" className="hover:text-fg">공약</a>
          <a href="#team" className="hover:text-fg">선본</a>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="relative mx-auto max-w-5xl overflow-hidden pt-14 pb-16 sm:pt-20">
      <span aria-hidden className="outline-hanja pointer-events-none absolute -top-6 right-[-0.08em] font-display text-[clamp(9rem,34vw,22rem)] leading-none opacity-30 select-none">
        {campaign.hanja}
      </span>
      <p className="relative font-mono text-xs tracking-[0.12em] text-muted uppercase">{campaign.election} · 선거운동본부</p>
      <h1 className="relative mt-4 font-display text-[clamp(5rem,22vw,11rem)] leading-[0.9] text-fg">{campaign.name}</h1>
      <p className="relative mt-5 text-[clamp(1.35rem,4.5vw,2rem)] font-semibold text-accent">“{campaign.slogan}”</p>
      <p className="relative mt-2 text-sm text-muted">{campaign.nameNote}</p>

      <div className="relative mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-[auto_1fr_1fr]">
        <div className="flex flex-col justify-center bg-accent px-6 py-5 text-on-accent">
          <span className="font-mono text-xs tracking-widest uppercase opacity-80">기호</span>
          <span className="font-display text-4xl leading-tight">{campaign.ballotNumber || '—'}</span>
          {!campaign.ballotNumber && <span className="text-xs opacity-80">추첨 전</span>}
        </div>
        {campaign.candidates.map((c) => (
          <div key={c.role} className="bg-surface px-6 py-5">
            <span className="font-mono text-xs tracking-widest text-muted uppercase">{c.role}</span>
            <p className="mt-1 font-display text-3xl text-fg">{c.name}</p>
            <p className="text-sm text-muted">{c.dept} {c.year}학번</p>
          </div>
        ))}
      </div>
      <p className="relative mt-4 font-mono text-xs text-muted tabular-nums">
        투표 {campaign.voteDate || '일정 확정 전'}
      </p>
    </section>
  )
}

function Why() {
  return (
    <section id="why" className="mx-auto max-w-5xl scroll-mt-20 border-t border-line py-16">
      <h2 className="font-display text-3xl text-fg sm:text-4xl">왜 나왔나</h2>
      <p className="mt-4 max-w-[38rem] text-lg text-fg">{campaign.coreGoal}</p>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {campaign.values.map((v, i) => (
          <div key={i} className="border-t-2 border-fg pt-4">
            <h3 className="text-lg font-semibold text-fg">{v.title || <Pending>{`핵심 가치 ${i + 1}`}</Pending>}</h3>
            <p className="mt-2 text-sm text-muted">{v.body || <Pending />}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const chipStyle: Record<Exclude<Feasibility, ''>, string> = {
  '총학 단독 가능': 'bg-solo-soft text-solo',
  '학교 협의 필요': 'bg-coop-soft text-coop',
  '총학 단독 + 학교 협의': 'bg-coop-soft text-coop',
}

function PledgeRow({ p, cat, showCat }: { p: Pledge; cat: string; showCat: boolean }) {
  const [open, setOpen] = useState(false)
  const n = filled(p)
  const status = n === 3 ? '작성 완료' : n > 0 ? '작성 중' : '초안'
  return (
    <li className="border-b border-line">
      <button
        id={`pledge-${p.id}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="group flex w-full items-start gap-4 py-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {p.core && <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-on-accent">메인공약</span>}
            {showCat && <span className="font-mono text-[11px] tracking-wider text-muted">{cat}</span>}
          </div>
          <h3 className="mt-1 text-[17px] font-semibold text-fg group-hover:text-accent">{p.title}</h3>
          {p.summary && <p className="mt-0.5 text-sm text-muted">{p.summary}</p>}
        </div>
        <span className={`mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs ${n === 3 ? 'bg-accent-soft text-accent' : 'border border-line text-muted'}`}>{status}</span>
        <ChevronDown className={`mt-1 size-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <dl className="mb-6 grid gap-5 rounded-lg bg-surface p-5 sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="font-mono text-xs tracking-wider text-muted">필요 이유</dt>
                <dd className="mt-1.5 text-sm text-fg">{p.why || <Pending />}</dd>
              </div>
              <div className="min-w-0">
                <dt className="font-mono text-xs tracking-wider text-muted">진행 방안</dt>
                <dd className="mt-1.5 text-sm text-fg">{p.how || <Pending />}</dd>
                {p.feasibility && <span className={`mt-3 inline-block rounded px-2 py-0.5 text-xs font-medium ${chipStyle[p.feasibility]}`}>{p.feasibility}</span>}
              </div>
              <div className="min-w-0">
                <dt className="font-mono text-xs tracking-wider text-muted">기대 효과</dt>
                <dd className="mt-1.5 text-sm text-fg">{p.effect || <Pending />}</dd>
              </div>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

function Pledges() {
  const initial = typeof location !== 'undefined' ? location.hash.slice(1) : ''
  const [tab, setTab] = useState(categories.some((c) => c.id === initial) ? initial : 'all')
  const [q, setQ] = useState('')

  useEffect(() => {
    if (tab !== 'all') history.replaceState(null, '', `#${tab}`)
  }, [tab])

  const list = useMemo(() => {
    const k = q.trim()
    return allPledges
      .filter((p) => tab === 'all' || p.catId === tab)
      .filter((p) => !k || (p.title + p.summary + p.why + p.how + p.effect).includes(k))
      .sort((a, b) => Number(!!b.core) - Number(!!a.core))
  }, [tab, q])

  const current = categories.find((c) => c.id === tab)
  const tabs = [{ id: 'all', name: '전체', count: allPledges.length }, ...categories.map((c) => ({ id: c.id, name: c.name, count: c.pledges.length }))]

  return (
    <section id="pledges" className="mx-auto max-w-5xl scroll-mt-20 border-t border-line py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl text-fg sm:text-4xl">공약</h2>
        <p className="font-mono text-xs text-muted tabular-nums">
          {allPledges.length}개 중 {doneCount}개 작성 완료
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${tab === t.id ? 'bg-fg text-bg' : 'border border-line text-muted hover:border-fg hover:text-fg'}`}
            >
              {t.name} <span className="tabular-nums opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 sm:w-64">
          <Search className="size-4 shrink-0 text-muted" />
          <input
            id="pledge-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="공약 검색 (예: 도서관)"
            className="w-full min-w-0 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
        </label>
      </div>

      {current && <p className="mt-6 text-muted">{current.intro}</p>}

      <ul className="mt-4 border-t border-line">
        {list.map((p) => (
          <PledgeRow key={p.id} p={p} cat={p.cat} showCat={tab === 'all'} />
        ))}
      </ul>
      {list.length === 0 && <p className="py-10 text-center text-muted">‘{q}’에 맞는 공약이 없어요. 다른 단어로 찾아보세요.</p>}
    </section>
  )
}

function Team() {
  return (
    <section id="team" className="mx-auto max-w-5xl scroll-mt-20 border-t border-line py-16">
      <h2 className="font-display text-3xl text-fg sm:text-4xl">선거운동본부</h2>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
        {team.map((t) => (
          <div key={t.name}>
            <h3 className="font-mono text-xs tracking-wider text-muted">{t.name}</h3>
            <ul className="mt-2 space-y-1 text-fg">
              {t.members.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Why />
        <Pledges />
        <Team />
      </main>
      <footer className="mx-auto max-w-5xl border-t border-line py-8 text-xs text-muted">
        {campaign.election} 선거운동본부 {campaign.name}
      </footer>
    </>
  )
}
