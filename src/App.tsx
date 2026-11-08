import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { budgetFacts, campaign, categories, roadmap, sources, team, type Category, type Pledge } from './data/site'

const { vote } = campaign
const total = categories.reduce((n, c) => n + c.pledges.length, 0)
const pledgeIndex = new Map(categories.flatMap((c) => c.pledges.map((p, i) => [p.id, { p, c, i }] as const)))

/* 공약 상세는 #/p/<id> 해시 화면. 목록은 그대로 둔 채 위에 덮어서, 돌아오면 보던 분야와 스크롤 위치가 그대로 남는다. */
const detailHash = (id: string) => `#/p/${id}`
const readDetail = () => {
  const m = location.hash.match(/^#\/p\/([\w-]+)$/)
  return m && pledgeIndex.has(m[1]) ? m[1] : null
}
const nav = { fromList: false, scrollY: 0 }
const afterPaint = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn))

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/** "문장 (출처)" → 본문 + 작은 출처 표기 */
function Cite({ text }: { text: string }) {
  const m = text.match(/^(.*?)\s*\(([^()]*)\)$/)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]} <span className="text-[12px] whitespace-nowrap text-muted">{m[2]}</span>
    </>
  )
}

function Label({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <p className={`text-sm font-semibold tracking-normal ${dark ? 'text-orange-ink' : 'text-orange'}`}>{children}</p>
}

const navLinks = [
  ['#pledges', '공약'],
  ['#slogan', '슬로건'],
  ['#candidates', '후보 소개'],
  ['#vote', '투표 안내'],
]

/* GOV.UK Frontend service navigation 방식: 모바일에선 aria-expanded 버튼으로 목록을 열고 닫고, 넓은 화면에선 항상 펼침 */
function Header() {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <header className="gutter sticky top-0 z-30 border-b border-white/10 bg-navy/90 backdrop-blur-md">
      <div className="wrap relative flex h-14 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2 font-extrabold tracking-[-0.04em]">
          <img src="figma/logo-orange.svg" alt="" className="logo h-7 w-auto" />
          <span className="text-lg">동력</span>
        </a>
        <button
          ref={button}
          type="button"
          aria-controls="site-menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="-mr-2 flex items-center gap-1.5 rounded-lg px-2 py-2 text-[15px] font-semibold md:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          메뉴
        </button>
        <nav aria-label="주 메뉴" className="md:static">
          <ul
            id="site-menu"
            className={`${open ? 'flex' : 'hidden'} absolute inset-x-[calc(-1*max(16px,env(safe-area-inset-left,0px)))] top-14 flex-col border-b border-white/10 bg-navy px-4 pb-3 md:static md:flex md:flex-row md:gap-7 md:border-0 md:bg-transparent md:p-0`}
          >
            {navLinks.map(([href, t]) => (
              <li key={href} className="border-t border-white/10 first:border-t-0 md:border-0">
                <a href={href} onClick={() => setOpen(false)} className="block py-3.5 text-[17px] font-semibold text-white md:py-2 md:text-[15px] md:font-normal md:text-white/80 md:hover:text-white">
                  {t}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

function VoteInfo({ large = false }: { large?: boolean }) {
  const rows = [
    ['투표기간', vote.period],
    ...(vote.time ? [['투표시간', vote.time]] : []),
    ['투표방법', vote.method],
  ]
  return (
    <dl className={large ? 'space-y-6' : 'space-y-5'}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className={`inline-block bg-orange px-3 py-0.5 font-bold text-navy ${large ? 'text-lg' : 'text-[15px]'}`}>{k}</dt>
          <dd className={`mt-2 leading-snug text-white ${large ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* 표지: 실제 포스터처럼 선거명 → 손글씨 슬로건(강조는 여기 한 곳) → 두 후보 → 공약 보기.
   두 사람은 정면을 보고 어깨가 안쪽으로 모여 있어 옆이 열려 있지 않다 → 제목은 인물 옆 빈칸(왼쪽 열)에 따로 두고 얼굴과 겹치지 않게 한다. */
function Hero() {
  const [lead, vice] = campaign.candidates
  return (
    <section id="top" aria-label="표지" className="texture gutter overflow-hidden">
      <div className="wrap grid gap-x-12 pt-6 md:grid-cols-[1fr_minmax(0,540px)] md:pt-12">
        <div className="md:col-start-1 md:row-start-1 md:self-end">
          <p className="text-[15px] font-semibold text-orange md:text-[17px]">{campaign.election}</p>
          <img src="figma/logo-orange.svg" alt="" className="logo mt-8 hidden w-[132px] md:block" />
          <h1 className="mt-4 md:mt-7">
            <img src="figma/slogan-hand.png" alt={campaign.tagline} width={2300} height={408} className="h-auto w-full max-w-[540px]" />
            <span className="sr-only"> — 선거운동본부 {campaign.name}</span>
          </h1>
        </div>

        <figure className="relative mx-auto mt-5 w-full max-w-[400px] md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:max-w-[540px]">
          <div className="h-[min(80vw,340px)] overflow-hidden md:h-auto">
            <img
              src="photos/duo-cross-cut.webp"
              alt={`팔짱을 낀 ${lead.role} ${lead.name}(왼쪽)과 ${vice.role} ${vice.name}(오른쪽)`}
              width={1261}
              height={1392}
              className="h-auto w-full"
            />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-navy/70 md:hidden" />
          <figcaption className="absolute inset-x-0 bottom-2 flex items-end justify-between px-1 md:bottom-6">
            {[lead, vice].map((c, i) => (
              <p key={c.name} className={i ? 'text-right' : ''}>
                <span className="block text-[13px] font-medium text-white/85 md:text-base">{c.role}</span>
                <span className="block text-[28px] leading-tight font-bold tracking-[0.06em] [text-shadow:0_2px_10px_rgba(11,9,49,.9)] md:text-[40px]">
                  {c.name}
                </span>
              </p>
            ))}
          </figcaption>
        </figure>

        <div className="mt-6 pb-8 md:col-start-1 md:row-start-2 md:mt-8 md:self-start md:pb-16">
          <a href="#pledges" className="cta inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3.5 text-[17px] font-bold text-navy">
            공약 보기 <ChevronDown className="size-5" aria-hidden />
          </a>
          <dl className="mt-5 space-y-1.5 text-[14.5px] leading-snug text-white/85 md:text-base">
            <div className="flex gap-2.5">
              <dt className="h-fit shrink-0 bg-orange px-1.5 text-[13px] font-bold text-navy">투표기간</dt>
              <dd>{vote.period}</dd>
            </div>
            <div className="flex gap-2.5">
              <dt className="h-fit shrink-0 bg-orange px-1.5 text-[13px] font-bold text-navy">투표방법</dt>
              <dd>{vote.method}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

const handArt = [
  { hand: 'figma/hand-first.svg', w: 96, line: 'figma/line-1.svg', lineW: 54 },
  { hand: 'figma/hand-together.svg', w: 106, line: 'figma/line-2.svg', lineW: 58 },
  { hand: 'figma/hand-end.svg', w: 142, line: 'figma/line-3.svg', lineW: 52 },
]

function Value({ i, side, className = '' }: { i: number; side: 'left' | 'right'; className?: string }) {
  const v = campaign.values[i]
  const art = handArt[i]
  const lineEl = <img src={art.line} alt="" width={art.lineW} className="hidden shrink-0 md:block" />
  return (
    <div className={`max-w-[300px] ${side === 'left' ? 'md:text-right' : ''} ${className}`}>
      <div className={`flex items-center gap-3 ${side === 'left' ? 'md:justify-end' : ''}`}>
        {side === 'right' && lineEl}
        <img src={art.hand} alt={v.key} width={art.w} className="h-auto" />
        {side === 'left' && lineEl}
      </div>
      <h3 className="mt-2 text-[22px] font-bold">
        <span className="sr-only">{v.key} </span>
        {v.title}
      </h3>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-body">{v.body}</p>
    </div>
  )
}

function Slogan() {
  return (
    <section id="slogan" className="gutter scroll-mt-14 py-16 sm:py-24">
      <Reveal className="wrap overflow-hidden rounded-[28px] bg-white px-5 py-10 text-ink sm:px-12 sm:py-14">
        <div className="flex items-center gap-2.5">
          <img src="figma/logo-navy.svg" alt="" className="logo h-8 w-auto" />
          <span className="font-extrabold tracking-[-0.03em]">Slogan</span>
        </div>
        <h2 className="mt-8 text-[clamp(2.5rem,8vw,4.6rem)] leading-[1.05] font-bold">동국을 움직일 힘</h2>
        <p className="mt-5 text-lg font-bold sm:text-xl">{campaign.coreGoal}</p>
        <p className="mt-2 max-w-[44rem] text-body">{campaign.nameNote}</p>

        <div className="mt-12 grid justify-items-center gap-10 md:mt-16 md:grid-cols-[1fr_auto_1fr] md:grid-rows-2 md:items-center md:gap-x-4 md:gap-y-14">
          <div className="relative grid place-items-center py-4 md:col-start-2 md:row-span-2 md:row-start-1 md:px-6">
            <div aria-hidden className="absolute size-[min(78vw,360px)] rounded-full bg-[radial-gradient(circle,rgba(253,104,4,.32)_0%,rgba(253,104,4,.12)_40%,rgba(253,104,4,0)_68%)]" />
            <img src="figma/logo-orange.svg" alt="" className="logo relative w-[150px] md:w-[190px]" />
          </div>
          <Value i={0} side="left" className="md:col-start-1 md:row-start-1 md:justify-self-end md:self-end" />
          <Value i={2} side="left" className="md:col-start-1 md:row-start-2 md:justify-self-end md:self-start" />
          <Value i={1} side="right" className="md:col-start-3 md:row-span-2 md:row-start-1 md:justify-self-start" />
        </div>
      </Reveal>
    </section>
  )
}

function Statement() {
  const { title, paragraphs } = campaign.statement
  return (
    <section id="statement" className="gutter relative overflow-hidden py-16 sm:py-24">
      <img src="figma/cover-shape-union.png" alt="" aria-hidden className="pointer-events-none absolute top-8 right-[-60px] w-[150px] opacity-70 sm:right-[-20px] sm:w-[230px]" />
      <img src="figma/cover-shape-subtract.png" alt="" aria-hidden className="pointer-events-none absolute bottom-[-80px] left-[-90px] w-[180px] opacity-60 sm:w-[260px]" />
      <Reveal className="wrap relative grid gap-8 md:grid-cols-[1fr_1.25fr] md:gap-14">
        <div>
          <Label>기조문</Label>
          <h2 className="mt-3 text-[clamp(1.85rem,4.6vw,2.9rem)] leading-[1.25] font-bold whitespace-pre-line">{title}</h2>
          <img src="photos/duo-stand-cut.webp" alt="나란히 선 전채희·전호빈 후보" loading="lazy" className="mt-12 hidden w-[min(90%,340px)] md:block" />
        </div>
        <div className="space-y-5 text-[15.5px] leading-[1.85] text-white/80">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === paragraphs.length - 1 ? 'font-semibold text-white' : ''}>
              {p}
            </p>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

function Meta({ p }: { p: Pledge }) {
  return (
    <dl className="grid gap-2.5 text-[14px] sm:grid-cols-2">
      <div className="rounded-xl bg-paper px-4 py-3">
        <dt className="text-[12px] font-bold text-orange-ink">예산</dt>
        <dd className="mt-0.5 text-body">{p.budget}</dd>
      </div>
      <div className="rounded-xl bg-paper px-4 py-3">
        <dt className="text-[12px] font-bold text-orange-ink">이행 점검 지표</dt>
        <dd className="mt-0.5 text-body">{p.measure}</dd>
      </div>
    </dl>
  )
}

function Why({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <h3 className="text-[13px] font-bold text-muted">왜 필요한가</h3>
      <ul className="mt-2 space-y-2 text-[15px] leading-relaxed text-body">
        {items.map((w, i) => (
          <li key={i} className="relative pl-3.5 before:absolute before:top-[0.7em] before:left-0 before:size-1.5 before:rounded-full before:bg-orange">
            <Cite text={w} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function How({ items }: { items: string[] }) {
  return (
    <div>
      <h3 className="text-[13px] font-bold text-muted">이렇게 하겠습니다</h3>
      <ol className="mt-2 space-y-2.5 text-[15px] leading-relaxed text-ink">
        {items.map((h, i) => (
          <li key={i} className="grid grid-cols-[24px_1fr] gap-2">
            <span className="mt-[2px] grid size-6 place-items-center rounded-full bg-navy text-[12px] font-bold text-white">{i + 1}</span>
            <span>{h}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function openFromList(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  nav.fromList = true
  nav.scrollY = window.scrollY
}

function PledgeRow({ p, i }: { p: Pledge; i: number }) {
  return (
    <a href={detailHash(p.id)} data-pledge={p.id} onClick={openFromList} className="row flex min-h-[52px] items-center gap-3 py-3">
      <span className="w-6 shrink-0 text-[13px] font-bold text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
      <span className="min-w-0 flex-1">
        {p.core && <span className="block text-[12px] font-bold text-orange-ink">메인공약</span>}
        <span className="block text-[16px] leading-snug font-semibold">{p.title}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </a>
  )
}

function CategoryToc({ c }: { c: Category }) {
  return (
    <section id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-16 rounded-[24px] bg-white px-4 pt-4 pb-2 text-ink sm:px-6 sm:pt-6">
      <div className="pill">
        <span className="num size-11 text-[19px]">{c.no}</span>
        <h3 id={`${c.id}-title`} className="bar py-2 text-[clamp(1.15rem,4.8vw,1.4rem)]">
          {c.name}
        </h3>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-body">{c.intro}</p>
      <ol className="mt-2 divide-y divide-line">
        {c.pledges.map((p, i) => (
          <li key={p.id}>
            <PledgeRow p={p} i={i} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function Pledges() {
  return (
    <section id="pledges" aria-labelledby="pledges-title" className="gutter scroll-mt-14 pt-10 pb-16 sm:pt-14 sm:pb-24">
      <div className="wrap">
        <Label>공약</Label>
        <h2 id="pledges-title" className="mt-2 text-[clamp(1.75rem,5vw,2.6rem)] leading-tight font-bold">
          세 가지 힘, 공약 {total}개
        </h2>
        <p className="mt-2 text-white/75">공약 이름을 누르면 자세한 내용이 열립니다.</p>
        <nav aria-label="분야 바로가기" className="mt-5 lg:hidden">
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="block rounded-full border border-white/25 px-3.5 py-1.5 text-[14px] font-semibold">
                  {c.no} {c.short}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 grid gap-5 lg:mt-8 lg:grid-cols-3 lg:items-start">
          {categories.map((c) => (
            <CategoryToc key={c.id} c={c} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PledgeDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { p, c, i } = pledgeIndex.get(id)!
  const prev = c.pledges[i - 1]
  const next = c.pledges[i + 1]
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const go = (e: MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault()
    location.replace(detailHash(to)) // 이전·다음은 기록을 쌓지 않음 → 뒤로 가기 한 번이면 목록
  }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="detail-title" className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-white text-ink">
      <div className="gutter sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[720px] items-center">
          <a
            href={`#${c.id}`}
            onClick={(e) => {
              e.preventDefault()
              onClose()
            }}
            className="back -ml-2 flex items-center gap-1 rounded-lg px-2 py-2 text-[15px] font-semibold"
          >
            <ChevronLeft className="size-5" aria-hidden />
            {c.name} 목록으로
          </a>
        </div>
      </div>
      <article className="gutter pb-16">
        <div className="mx-auto max-w-[720px] pt-6">
          <p className="text-[14px] font-semibold text-muted tabular-nums">
            {c.no} {c.name} · {i + 1}/{c.pledges.length}
          </p>
          {p.core && <p className="mt-3 text-[13px] font-bold text-orange-ink">메인공약</p>}
          <h2 id="detail-title" ref={heading} tabIndex={-1} className="mt-1 text-[clamp(1.55rem,6.4vw,2.3rem)] leading-[1.25] font-bold outline-none">
            {p.title}
          </h2>
          <p className="mt-5 rounded-[20px] bg-bubble px-5 py-4 text-[17px] leading-snug font-bold">{p.summary}</p>
          <div className="mt-8 space-y-8">
            <Why items={p.why} />
            {p.how.length > 0 && <How items={p.how} />}
            <Meta p={p} />
            {c.method && (
              <div className="rounded-2xl bg-paper p-4">
                <h3 className="text-[13px] font-bold text-muted">시설 공약은 모두 이 순서로 진행합니다</h3>
                <ol className="mt-2 space-y-1.5 text-[14.5px] font-semibold">
                  {c.method.map((m, k) => (
                    <li key={k} className="flex gap-2">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-orange text-[11px] text-navy">{k + 1}</span>
                      {m}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          {(prev || next) && (
            <nav aria-label="같은 분야의 다른 공약" className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
              {prev ? (
                <a href={detailHash(prev.id)} onClick={(e) => go(e, prev.id)} className="row rounded-xl bg-paper px-4 py-3">
                  <span className="block text-[13px] text-muted">‹ 이전 공약</span>
                  <span className="block font-semibold">{prev.title}</span>
                </a>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next && (
                <a href={detailHash(next.id)} onClick={(e) => go(e, next.id)} className="row rounded-xl bg-paper px-4 py-3 sm:text-right">
                  <span className="block text-[13px] text-muted">다음 공약 ›</span>
                  <span className="block font-semibold">{next.title}</span>
                </a>
              )}
            </nav>
          )}
        </div>
      </article>
    </div>
  )
}

/* 목록 → 상세 → 뒤로: 브라우저 뒤로 가기와 '목록으로' 링크 모두 같은 자리·같은 공약 줄로 돌아온다 */
function useDetailRoute() {
  const [id, setId] = useState(readDetail)
  const current = useRef(id)
  useEffect(() => {
    const onHash = () => {
      const nextId = readDetail()
      const closing = current.current && !nextId ? current.current : null
      current.current = nextId
      setId(nextId)
      if (closing) {
        afterPaint(() => {
          if (nav.fromList) window.scrollTo(0, nav.scrollY)
          else document.getElementById(pledgeIndex.get(closing)!.c.id)?.scrollIntoView()
          document.querySelector<HTMLElement>(`[data-pledge="${closing}"]`)?.focus({ preventScroll: true })
          nav.fromList = false
        })
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const close = useCallback(() => {
    if (nav.fromList) return history.back()
    const entry = current.current && pledgeIndex.get(current.current)
    history.replaceState(null, '', entry ? `#${entry.c.id}` : '#pledges')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, [])
  return [id, close] as const
}

function Budget() {
  return (
    <section id="budget" className="gutter py-16 sm:py-24">
      <div className="wrap">
        <Reveal>
          <Label>예산 근거</Label>
          <h2 className="mt-3 text-[clamp(1.8rem,4.6vw,2.8rem)] leading-[1.25] font-bold">
            새 돈을 만드는 공약이 아닙니다.
            <br />
            있는 예산이 제때 쓰이게 하겠습니다.
          </h2>
          <p className="mt-3 text-white/75">2025년 서울캠퍼스 결산에서 예산보다 덜 쓴 금액입니다.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {budgetFacts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/10 bg-block/50 p-6">
                <p className="text-[15px] text-white/75">{f.label}</p>
                <p className="mt-1 text-[clamp(2.6rem,7vw,3.6rem)] leading-none font-extrabold tracking-[-0.05em] text-orange tabular-nums">{f.value}</p>
                <p className="mt-3 text-[14px] text-white/80">{f.body}</p>
                <p className="mt-1 text-[12px] text-white/50">{f.source}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-12 rounded-[28px] bg-white px-5 py-8 text-ink sm:px-10 sm:py-10">
          <div className="pill max-w-[520px]">
            <span className="num size-12 text-[20px] sm:size-16 sm:text-[26px]">27</span>
            <h3 className="bar py-2.5 text-[clamp(1.2rem,4vw,1.9rem)] sm:py-3">2027년, 이렇게 움직입니다</h3>
          </div>
          <ol className="mt-8 grid gap-0 md:grid-cols-6 md:gap-4">
            {roadmap.map((r, i) => (
              <li key={r.when} className="relative grid grid-cols-[20px_1fr] gap-3 pb-6 md:block md:pb-0">
                <span className="relative z-10 mt-1 block size-3.5 rounded-full border-[3px] border-orange bg-white md:mt-0" />
                {i < roadmap.length - 1 && (
                  <span aria-hidden className="absolute top-5 bottom-0 left-[6px] w-0.5 bg-line md:top-[6px] md:right-[-16px] md:bottom-auto md:left-5 md:h-0.5 md:w-auto" />
                )}
                <div className="md:mt-4">
                  <p className="text-[13px] font-bold text-orange-ink tabular-nums">{r.when}</p>
                  <p className="mt-1 text-[14.5px] leading-snug font-semibold">{r.what}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

function Candidates() {
  const chief = team.find((t) => t.name === '선거운동본부장')
  return (
    <section id="candidates" className="gutter scroll-mt-14 pb-16 sm:pb-24">
      <Reveal className="wrap rounded-[28px] bg-white px-5 py-9 text-ink sm:px-10 sm:py-12">
        <div className="flex items-center gap-2.5">
          <img src="figma/logo-navy.svg" alt="" className="logo h-8 w-auto" />
          <h2 className="text-lg font-extrabold">후보 소개</h2>
        </div>
        <div className="mt-8 grid gap-12 md:grid-cols-2 md:gap-10">
          {campaign.candidates.map((c) => (
            <article key={c.name}>
              <div className="flex items-end gap-5">
                <img src={c.photo} alt={`${c.role} ${c.name}`} className="aspect-[3/4] w-[128px] shrink-0 rounded-2xl bg-paper object-cover sm:w-[150px]" />
                <div className="min-w-0 pb-1">
                  <Label dark>{c.role}</Label>
                  <h3 className="mt-1 text-[2.4rem] leading-none font-bold tracking-[0.12em]">{c.name}</h3>
                  <p className="mt-3 font-semibold">
                    {c.dept} {c.year}학번
                  </p>
                  <p className="text-sm text-muted">{c.extra}</p>
                </div>
              </div>
              <div className="mt-7 space-y-5">
                {c.history.map((h) => (
                  <div key={h.year} className="grid grid-cols-[56px_1fr] gap-3">
                    <span className="h-fit rounded-full bg-navy py-0.5 text-center text-[13px] font-bold text-white tabular-nums">{h.year}</span>
                    <ul className="space-y-1 text-[14.5px] leading-snug text-body">
                      {h.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
        {chief && (
          <p className="mt-10 border-t border-line pt-5 text-[14.5px] text-body">
            <span className="font-bold text-ink">선거운동본부장</span> {chief.members.join(', ')}
          </p>
        )}
      </Reveal>
    </section>
  )
}

function Vote() {
  return (
    <section id="vote" className="texture gutter relative scroll-mt-14 overflow-hidden pt-16 sm:pt-24">
      <img
        src="figma/campus-lineart.webp"
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 w-[max(130%,820px)] max-w-none -translate-x-1/2 opacity-70 sm:w-[min(1400px,110%)]"
      />
      <div className="wrap relative grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-end">
        <Reveal className="md:pb-[clamp(120px,14vw,200px)]">
          <Label>Vote</Label>
          <h2 className="mt-3 text-[clamp(2rem,5.4vw,3.4rem)] leading-[1.2] font-bold">
            여러분의 소중한 한 표가
            <br />
            <span className="text-orange">동국을 이끄는 힘</span>이 됩니다.
          </h2>
          <p className="mt-4 max-w-[30rem] text-white/80">{vote.note}</p>
          <div className="mt-8">
            <VoteInfo />
          </div>
        </Reveal>
        <img src="photos/duo-wave-cut.webp" alt="손을 흔드는 전채희·전호빈 후보" className="relative mx-auto w-[min(100%,470px)]" />
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="gutter border-t border-white/10 bg-[#07061f] py-10 text-sm text-white/65">
      <div className="wrap">
        <details>
          <summary className="flex items-center gap-2 font-semibold text-white/85">
            자료 출처 {sources.length}건
            <ChevronDown className="chev size-4 transition-transform" aria-hidden />
          </summary>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-white/25 underline-offset-4 hover:text-white">
                  {s.title}
                </a>
              </li>
            ))}
            <li>2025-1·2025-2·2026-1 학자요구안과 학교 답변</li>
          </ul>
        </details>
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p>{campaign.org}</p>
          <img src="figma/logo-white.svg" alt="" className="logo h-6 w-auto" />
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [detail, closeDetail] = useDetailRoute()
  return (
    <>
      <div inert={!!detail} aria-hidden={detail ? true : undefined}>
        <Header />
        <main>
          <Hero />
          <Pledges />
          <Slogan />
          <Statement />
          <Budget />
          <Candidates />
          <Vote />
        </main>
        <Footer />
      </div>
      {detail && <PledgeDetail key={detail} id={detail} onClose={closeDetail} />}
    </>
  )
}
