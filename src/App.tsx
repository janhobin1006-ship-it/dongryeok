import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ChevronDown, ChevronLeft, ChevronRight, Menu, RotateCcw, X } from 'lucide-react'
import { aliases, campaign, candidates, categories, roadmap, sources, type Block, type Candidate, type Category, type Pledge, type Step } from './data/site'

const { vote } = campaign
const listed = (c: Category) => c.pledges.filter((p) => !p.hidden)
const all = categories.flatMap(listed)
const pledgeIndex = new Map(categories.flatMap((c) => c.pledges.map((p, i) => [p.id, { p, c, i }] as const)))
const catById = new Map(categories.map((c) => [c.id, c]))

/* 로드맵 문구: "[계절학기 수요조사](summer-session)" → 해당 공약으로 이어지는 링크 */
const LINK = /\[([^\]]+)\]\(([\w-]+)\)/g
const roadmapByPledge = new Map<string, { period: string; text: string }[]>()
for (const rows of Object.values(roadmap.rows))
  rows.forEach((cell, pi) =>
    cell.forEach((line) => {
      for (const m of line.matchAll(LINK)) {
        const list = roadmapByPledge.get(m[2]) ?? []
        if (!list.some((e) => e.period === roadmap.periods[pi] && e.text === m[1])) list.push({ period: roadmap.periods[pi], text: m[1] })
        roadmapByPledge.set(m[2], list)
      }
    }),
  )

/* 공약 상세는 #/p/<id> 해시 화면. 목록·일정은 그대로 둔 채 위에 덮어서, 돌아오면 보던 자리와 선택한 시기가 그대로 남는다. */
const detailHash = (id: string) => `#/p/${id}`
const readDetail = () => {
  const m = location.hash.match(/^#\/p\/([\w-]+)$/)
  if (!m) return null
  const id = aliases[m[1]] ?? m[1] // 통합된 공약의 예전 주소 → 합쳐진 공약으로
  if (id !== m[1]) history.replaceState(history.state, '', detailHash(id))
  return pledgeIndex.has(id) ? id : null
}
const nav: { fromList: boolean; scrollY: number; from: string; opener: HTMLElement | null } = { fromList: false, scrollY: 0, from: 'list', opener: null }
if ('scrollRestoration' in history) history.scrollRestoration = 'manual' // 돌아올 때 위치는 직접 복원
const afterPaint = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn))
const flash = (el: Element) => {
  el.classList.add('just-read')
  setTimeout(() => el.classList.remove('just-read'), 2200)
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

/** "문장 (출처)" → 본문 + 작은 출처 표기 */
function Cite({ text }: { text: string }) {
  const m = text.match(/^(.*?)\s*\(([^()]+)\)$/)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]} <span className="t-meta whitespace-nowrap text-muted">— {m[2]}</span>
    </>
  )
}

function openFromList(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  nav.fromList = true
  nav.scrollY = window.scrollY
  nav.opener = e.currentTarget
  nav.from = e.currentTarget.dataset.from ?? 'list'
}

/* 분야 목차·기조문 → 월별 추진 일정의 해당 분야로 */
const showRoadmapField = (field: string) => window.dispatchEvent(new CustomEvent('roadmap-field', { detail: field }))

const navLinks = [
  ['#pledges', '공약'],
  ['#roadmap', '월별 추진 일정'],
  ['#candidates', '후보 소개'],
  ['#statement', '기조문'],
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
      <div className="wrap flex h-14 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5" aria-label={`${campaign.nameEn} 처음으로`}>
          <img src="figma/logo-orange.svg" alt="" className="logo h-7 w-auto" />
          <span className="t-wordmark">{campaign.nameEn}</span>
        </a>
        <button
          ref={button}
          type="button"
          aria-controls="site-menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="menu-btn -mr-2 flex items-center gap-1.5 rounded-lg px-2 py-2 text-[15px] font-semibold lg:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          메뉴
        </button>
        <nav aria-label="주 메뉴" className="max-lg:absolute max-lg:inset-x-0 max-lg:top-14">
          <ul id="site-menu" className={`${open ? 'block' : 'hidden'} border-b border-white/10 bg-navy px-4 pb-2 lg:flex lg:gap-7 lg:border-0 lg:bg-transparent lg:p-0`}>
            {navLinks.map(([href, t]) => (
              <li key={href} className="border-t border-white/10 first:border-t-0 lg:border-0">
                <a href={href} onClick={() => setOpen(false)} className="block py-3.5 text-[17px] font-semibold text-white lg:py-2 lg:text-[15px] lg:font-normal lg:text-white/80 lg:hover:text-white">
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

function VoteList({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const rows = [
    ['투표 기간', vote.period],
    ...(vote.time ? [['투표 시간', vote.time]] : []),
    ['투표 방법', vote.method],
  ]
  return (
    <dl className={size === 'lg' ? 'space-y-5' : 'space-y-1'}>
      {rows.map(([k, v]) => (
        <div key={k} className={size === 'lg' ? 'sm:flex sm:items-baseline sm:gap-5' : 'flex gap-2.5'}>
          <dt className={`h-fit shrink-0 bg-orange font-bold text-navy ${size === 'lg' ? 'inline-block px-3 py-0.5 text-[15px]' : 'px-1.5 text-[13px]'}`}>{k}</dt>
          <dd className={size === 'lg' ? 't-lead mt-2 text-white sm:mt-0' : 't-meta text-[14.5px] text-white/85'}>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* 1면 표지: 짙은 남색 + 하단으로 번지는 자줏빛, 흰색 심벌, '동력 정책자료집', 캠퍼스 선화. 첫 문구는 표지와 슬로건에서 */
function Hero() {
  return (
    <section id="top" aria-labelledby="cover-title" className="cover-bg relative overflow-hidden">
      <div className="gutter relative z-10">
        <div className="wrap flex flex-col items-center pt-7 pb-[clamp(150px,34vw,330px)] text-center md:pt-12">
          <p className="t-cover-org">{campaign.org}</p>
          <img src="figma/logo-white.svg" alt="" className="logo mt-9 w-[min(34vw,170px)] md:mt-12 md:w-[200px]" />
          <h1 id="cover-title" className="t-cover-title mt-6">
            {campaign.bookTitle}
          </h1>
          <p className="mt-7">
            <img src="figma/slogan-final.png" alt={campaign.slogan} width={994} height={212} className="h-auto w-[min(76vw,380px)]" />
          </p>
          <p className="t-lead mt-3 max-w-[26ch] text-white/85 md:max-w-none">{campaign.sloganSub}</p>
          <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
            <a href="#pledges" className="cta inline-flex items-center justify-center gap-2 rounded-full bg-orange px-7 py-3.5 text-[17px] font-bold text-navy">
              공약 보기 <ChevronDown className="size-5" aria-hidden />
            </a>
            <a href="#roadmap" className="cta inline-flex items-center justify-center gap-2 rounded-full border border-white/50 px-7 py-3.5 text-[17px] font-bold text-white">
              월별 추진 일정 <ChevronDown className="size-5" aria-hidden />
            </a>
          </div>
        </div>
      </div>
      <img src="figma/campus-lineart-cover.webp" alt="" width={1748} height={1262} className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-auto w-full max-w-[1200px] opacity-50" />
    </section>
  )
}

/* 2~3면 후보 소개: '동국을 움직일 힘, 동력을 만들다' → 두 후보 사진(왼쪽 부후보 전채희, 오른쪽 정후보 전호빈) → 이름·전공 → 연도별 약력 */
function Bio({ c, className = '' }: { c: Candidate; className?: string }) {
  return (
    <section aria-labelledby={`bio-${c.name}`} className={className}>
      <h3 id={`bio-${c.name}`} className="t-pledge border-b border-ink pb-2">
        {c.role} {c.name} 약력
      </h3>
      <p className="t-meta mt-3 text-muted">{c.origin}</p>
      <dl className="mt-4 space-y-5">
        {c.history.map((h) => (
          <div key={h.year} className="grid grid-cols-[3.25rem_1fr] gap-x-3">
            <dt className="t-meta pt-0.5 font-bold text-ink tabular-nums">{h.year}</dt>
            <dd>
              <ul className="space-y-1.5">
                {h.items.map((it) => (
                  <li key={it} className="t-small text-body">
                    {it}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Candidates() {
  const [lead, vice] = candidates
  return (
    <section id="candidates" aria-labelledby="candidates-title" className="gutter scroll-mt-14 bg-white py-14 text-ink sm:py-20">
      <div className="wrap">
        <p className="t-kicker text-orange-ink">후보 소개</p>
        <h2 id="candidates-title" className="mt-3">
          <span className="sr-only">동국을 움직일 힘, 동력을 만들다</span>
          <span aria-hidden className="flex flex-wrap items-end gap-x-4 gap-y-1">
            <img src="figma/hand-candidates-1.png" alt="" width={515} height={106} className="h-auto w-[min(80vw,400px)]" />
            <img src="figma/hand-candidates-2.png" alt="" width={531} height={147} className="h-auto w-[min(82vw,412px)]" />
          </span>
        </h2>
        <figure className="mx-auto mt-8 max-w-[720px]">
          <div className="overflow-hidden rounded-2xl bg-paper">
            <img src="photos/duo-candidates.webp" alt={`${vice.role} ${vice.name}(왼쪽)과 ${lead.role} ${lead.name}(오른쪽)`} width={1400} height={1392} loading="lazy" className="h-auto w-full" />
          </div>
          <figcaption className="mt-4 grid grid-cols-2 gap-3 text-center">
            {[vice, lead].map((c) => (
              <div key={c.name}>
                <p className="t-kicker text-orange-ink">{c.role}</p>
                <p className="t-name mt-0.5">{c.name}</p>
                <p className="t-pledge mt-1">
                  {c.dept} {c.year}
                </p>
                <p className="t-meta mt-0.5 text-muted">{c.minor}</p>
              </div>
            ))}
          </figcaption>
        </figure>
        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-12">
          <Bio c={lead} className="md:order-2" />
          <Bio c={vice} className="md:order-1" />
        </div>
      </div>
    </section>
  )
}

/* 4면 슬로건: 먼저 움직이겠습니다 / 함께 만들겠습니다 / 끝까지 책임지겠습니다 (손글씨는 자료집 원본 벡터) */
const handOf: Record<string, [string, number, number]> = { 먼저: ['hand-first', 64, 30], 함께: ['hand-together', 71, 37], 끝까지: ['hand-end', 95, 39] }
function Slogan() {
  return (
    <section id="slogan" aria-labelledby="slogan-title" className="gutter scroll-mt-14 border-t border-line bg-white py-14 text-ink sm:py-20">
      <div className="wrap">
        <Reveal>
          <p className="t-kicker text-orange-ink">슬로건</p>
          <h2 id="slogan-title" className="t-h2 mt-2">
            {campaign.slogan}
          </h2>
          <p className="t-lead mt-3 font-semibold text-orange-ink">{campaign.sloganSub}</p>
          <p className="t-body mt-4 max-w-[62ch] text-body">{campaign.nameNote}</p>
        </Reveal>
        <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {campaign.values.map((v) => {
            const [file, w, h] = handOf[v.key]
            return (
              <li key={v.key} className="border-t-2 border-ink pt-4">
                <p>
                  <img src={`figma/${file}.svg`} alt={v.key} width={w} height={h} className="h-10 w-auto" />
                </p>
                <p className="t-pledge-main mt-2">{v.title}</p>
                <p className="t-body mt-2 text-body">{v.body}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* 5면 기조문 전문 + 후보 등록 서류의 출마소견(원문 구분) */
function Statement() {
  const { title, intro, powers, outro } = campaign.statement
  const sp = campaign.speech
  return (
    <section id="statement" aria-labelledby="statement-title" className="gutter scroll-mt-14 py-16 sm:py-24">
      <div className="wrap grid gap-8 md:grid-cols-[minmax(0,340px)_1fr] md:gap-16">
        <div>
          <p className="t-kicker text-orange">기조문</p>
          <h2 id="statement-title" className="t-h2 mt-2">
            {title}
          </h2>
        </div>
        <div className="max-w-[62ch]">
          <div className="space-y-5">
            {intro.map((t, i) => (
              <p key={i} className="t-body text-white/85">
                {t}
              </p>
            ))}
          </div>
          <ul className="mt-6 space-y-5 border-l-2 border-orange pl-5">
            {powers.map((pw) => (
              <li key={pw.title}>
                <a href={`#${pw.cat}`} className="t-pledge-main text-orange hover:underline">
                  {pw.title}
                </a>
                {pw.lines.map((l) => (
                  <p key={l} className="t-body text-white/85">
                    {l}
                  </p>
                ))}
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-5">
            {outro.map((t, i) => (
              <p key={i} className={`t-body ${i === outro.length - 1 ? 'font-semibold text-white' : 'text-white/85'}`}>
                {t}
              </p>
            ))}
          </div>

          <details className="speech mt-12 rounded-2xl border border-white/20 px-5 py-4">
            <summary className="flex items-center justify-between gap-3">
              <span>
                <span className="t-kicker block text-orange">출마소견 · 후보 등록 서류</span>
                <span className="t-small mt-1 block text-white/85">
                  선거 구호 <strong className="text-white">{campaign.officialSlogan}</strong>
                </span>
              </span>
              <ChevronDown className="chev size-5 shrink-0 transition-transform" aria-hidden />
            </summary>
            <div className="mt-5 space-y-4 border-t border-white/15 pt-5">
              {sp.paragraphs.map((t, i) => (
                <p key={i} className="t-body text-white/85">
                  {t}
                </p>
              ))}
              <p className="t-small text-white/70">{sp.sign}</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}

/* 6면 목차 + 각 분야 표지(01·02·03). 등록 공약명 그대로, 줄 전체가 상세로 가는 링크 */
function PledgeRow({ p, n }: { p: Pledge; n?: number }) {
  return (
    <a href={detailHash(p.id)} data-pledge={p.id} onClick={openFromList} className={`row -mx-2 flex items-start gap-2 rounded-md px-2 py-2.5 text-ink`}>
      {n && <span className="t-pledge-main w-6 shrink-0 text-orange-ink tabular-nums">{n}.</span>}
      <span className={`min-w-0 flex-1 ${p.core ? 't-pledge-main' : 't-pledge'}`}>
        {p.core && <span className="sr-only">메인공약 </span>}
        {p.title}
      </span>
      <ChevronRight className="mt-[3px] size-4 shrink-0 opacity-40" aria-hidden />
    </a>
  )
}

function SectionCover({ c, as: H = 'h3' }: { c: Category; as?: 'h2' | 'h3' }) {
  return (
    <div className="sec-cover relative overflow-hidden rounded-2xl px-6 pt-6 pb-24 text-white sm:pb-28">
      <p aria-hidden className="t-num">
        {c.num}
      </p>
      <H id={`${c.id}-title`} className="t-sec-name mt-1">
        <span className="sr-only">{c.num} </span>
        {c.name}
      </H>
      <p className="t-meta mt-2 text-white/75">
        공약 {listed(c).length}개 · 메인공약 {listed(c).filter((p) => p.core).length}개
      </p>
      <a
        href="#roadmap"
        onClick={() => showRoadmapField(c.id)}
        className="cta relative z-10 mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/45 px-4 py-2 text-[15px] font-semibold"
      >
        {c.short} 월별 추진 일정 <ChevronRight className="size-4" aria-hidden />
      </a>
      <img src="figma/campus-lineart.webp" alt="" width={1080} height={618} loading="lazy" className="pointer-events-none absolute inset-x-0 bottom-0 h-auto w-full opacity-60" />
    </div>
  )
}

function CategoryToc({ c }: { c: Category }) {
  const mains = listed(c).filter((p) => p.core)
  const extras = listed(c).filter((p) => !p.core)
  return (
    <section id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-16 lg:grid lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-12">
      <SectionCover c={c} />
      <div className="mt-6 lg:mt-1">
        <p className="t-kicker text-orange-ink">메인공약</p>
        <ol className="mt-1">
          {mains.map((p, i) => (
            <li key={p.id}>
              <PledgeRow p={p} n={i + 1} />
            </li>
          ))}
        </ol>
        <p className="t-kicker mt-6 text-orange-ink">추가 공약</p>
        <ul className="mt-1 border-t border-line">
          {extras.map((p) => (
            <li key={p.id} className="border-b border-line">
              <PledgeRow p={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Pledges() {
  const counts = categories.map((c) => `${c.short} ${listed(c).length}`).join(' · ')
  return (
    <section id="pledges" aria-labelledby="pledges-title" className="gutter scroll-mt-14 bg-white pt-14 pb-16 text-ink sm:pt-20 sm:pb-24">
      <div className="wrap">
        <div className="border-b border-ink pb-4">
          <p className="t-kicker text-orange-ink">목차</p>
          <h2 id="pledges-title" className="t-h2 mt-2">
            {campaign.tocTitle}
          </h2>
          <p className="t-meta mt-2 text-muted">
            메인공약 {all.filter((p) => p.core).length}개와 추가 공약 {all.filter((p) => !p.core).length}개({counts}) · 공약명을 누르면 자세히 볼 수 있습니다
          </p>
        </div>
        <div className="mt-10 space-y-16 sm:space-y-20">
          {categories.map((c) => (
            <CategoryToc key={c.id} c={c} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* 11·16·21면 실행 로드맵 → 하나의 월별 일정. 모바일: 시기를 고르면 세 분야가 세로로 / 데스크톱: 시기 = 열, 분야 = 행 */
function RoadmapLine({ line }: { line: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const m of line.matchAll(LINK)) {
    if (m.index! > last) parts.push(line.slice(last, m.index))
    parts.push(
      <a key={m.index} href={detailHash(m[2])} data-pledge={m[2]} data-from="roadmap" onClick={openFromList} className="rm-link">
        {m[1]}
      </a>,
    )
    last = m.index! + m[0].length
  }
  if (last < line.length) parts.push(line.slice(last))
  return <>{parts}</>
}

function Roadmap() {
  const [period, setPeriod] = useState(0)
  const [focusField, setFocusField] = useState<string | null>(null)
  const fields = Object.keys(roadmap.rows)
  useEffect(() => {
    const on = (e: Event) => {
      const field = (e as CustomEvent<string>).detail
      setFocusField(field)
      afterPaint(() => {
        const el = [...document.querySelectorAll<HTMLElement>(`[data-rm-field="${field}"]`)].find((x) => x.offsetParent)
        el?.scrollIntoView({ block: 'start', behavior: 'instant' })
        window.scrollBy({ top: -72, behavior: 'instant' })
        if (el) flash(el)
      })
      setTimeout(() => setFocusField(null), 2600)
    }
    window.addEventListener('roadmap-field', on)
    return () => window.removeEventListener('roadmap-field', on)
  }, [])
  return (
    <section id="roadmap" aria-labelledby="roadmap-title" className="gutter scroll-mt-14 bg-paper py-14 text-ink sm:py-20">
      <div className="wrap">
        <p className="t-kicker text-orange-ink">실행 로드맵</p>
        <h2 id="roadmap-title" className="t-h2 mt-2">
          월별 추진 일정
        </h2>
        <p className="t-body mt-2 max-w-[60ch] text-body">시설·배움·모두 세 분야의 로드맵을 시기별로 모았습니다. 공약명이 있는 일정은 눌러서 바로 볼 수 있습니다.</p>

        {/* 모바일·태블릿: 시기 선택 → 세 분야 */}
        <div className="lg:hidden">
          <div role="group" aria-label="시기 선택" className="mt-7 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {roadmap.periods.map((t, i) => (
              <button key={t} type="button" aria-pressed={period === i} onClick={() => setPeriod(i)} className="period-btn rounded-xl px-2 py-3 text-[15px] font-bold">
                {t}
              </button>
            ))}
          </div>
          <div aria-live="polite" className="mt-6 space-y-4">
            <p className="sr-only">{roadmap.periods[period]} 추진 일정</p>
            {fields.map((f) => {
              const c = catById.get(f)!
              return (
                <section key={f} data-rm-field={f} aria-label={`${c.name} ${roadmap.periods[period]}`} className={`rm-card rounded-2xl bg-white px-5 py-4 ${focusField === f ? 'is-focus' : ''}`}>
                  <p className="t-kicker text-orange-ink">
                    {c.num} {c.name}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {roadmap.rows[f][period].map((line) => (
                      <li key={line} className="t-pledge flex gap-2">
                        <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-orange" />
                        <span>
                          <RoadmapLine line={line} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </div>

        {/* 데스크톱: 시기 = 열, 분야 = 행 */}
        <div className="mt-9 hidden lg:block">
          <table className="rm-table w-full table-fixed border-separate border-spacing-0">
            <caption className="sr-only">분야별 월별 추진 일정</caption>
            <thead>
              <tr>
                <th scope="col" className="w-[150px]">
                  <span className="sr-only">분야</span>
                </th>
                {roadmap.periods.map((t, i) => (
                  <th key={t} scope="col" className="p-1">
                    <button type="button" aria-pressed={period === i} onClick={() => setPeriod(i)} className="period-btn w-full rounded-xl px-2 py-2.5 text-[15px] font-bold">
                      {t}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => {
                const c = catById.get(f)!
                return (
                  <tr key={f} data-rm-field={f} className={focusField === f ? 'is-focus' : ''}>
                    <th scope="row" className="rm-rowhead px-3 py-4 text-left align-top">
                      <span className="t-num-sm block">{c.num}</span>
                      <span className="t-pledge block">{c.name}</span>
                    </th>
                    {roadmap.rows[f].map((cell, i) => (
                      <td key={i} className={`rm-cell px-3 py-4 align-top ${period === i ? 'is-on' : ''}`}>
                        <ul className="space-y-1.5">
                          {cell.map((line) => (
                            <li key={line} className="t-small text-ink">
                              <RoadmapLine line={line} />
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

/* 상세 도식: 단계 흐름(세로 번호 + 연결선, 반복이면 마지막에 되돌아가는 표시) */
function Flow({ steps, loop }: { steps: Step[]; loop?: string }) {
  const short = steps.every((s) => !s.body && !s.chips)
  return (
    <div className="mt-4">
      <ol className={short ? 'cycle' : 'flow'}>
        {steps.map((s, k) => (
          <li key={k} className="flow-step">
            <span className="flow-num" aria-hidden>
              {k + 1}
            </span>
            <div className="min-w-0">
              <p className="t-pledge text-ink">
                <span className="sr-only">{k + 1}단계 </span>
                {s.title}
                {s.tag && <span className="flow-tag ml-2 align-[2px]">{s.tag}</span>}
              </p>
              {s.body && <p className="t-body mt-1 text-body">{s.body}</p>}
              {s.chips && (
                <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                  {s.chips.map((ch) => (
                    <li key={ch.t} className="rounded-xl bg-navy px-4 py-3 text-white">
                      <p className="font-bold">{ch.t}</p>
                      <p className="t-small mt-0.5 text-white/85">{ch.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {short && k < steps.length - 1 && <ArrowDown className="cycle-arrow size-5 text-orange-ink" aria-hidden />}
          </li>
        ))}
      </ol>
      {loop && (
        <p className="t-pledge mt-3 inline-flex items-center gap-2 rounded-full bg-orange/15 px-4 py-2 text-orange-ink">
          <RotateCcw className="size-4" aria-hidden />
          {loop}
        </p>
      )}
    </div>
  )
}

function Branches({ branches, focus }: { branches: Extract<Block, { type: 'branches' }>['branches']; focus?: string }) {
  const jump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(`branch-${id}`)
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    if (el) flash(el)
  }
  return (
    <div className="mt-4">
      <nav aria-label="두 갈래" className="flex gap-2">
        {branches.map((b) => (
          <a key={b.id} href={`#branch-${b.id}`} onClick={(e) => jump(e, b.id)} className={`period-btn rounded-full px-4 py-2 text-[15px] font-bold ${focus === b.id ? 'is-target' : ''}`}>
            {b.label}
          </a>
        ))}
      </nav>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {branches.map((b) => (
          <section key={b.id} id={`branch-${b.id}`} aria-labelledby={`branch-${b.id}-t`} className="scroll-mt-20 rounded-2xl border border-line px-5 py-5">
            <p className="t-kicker text-orange-ink">{b.label}</p>
            <h4 id={`branch-${b.id}-t`} className="t-pledge-main mt-1">
              {b.title}
            </h4>
            <ol className="mt-4 space-y-4">
              {b.steps.map((s, k) => (
                <li key={k} className="grid grid-cols-[auto_1fr] gap-3">
                  {s.tag ? <span className="flow-tag mt-0.5 self-start whitespace-nowrap">{s.tag}</span> : <span aria-hidden className="mt-[0.6em] size-2 rounded-full bg-orange" />}
                  <div>
                    {s.title && <p className="font-bold text-ink">{s.title}</p>}
                    <p className="t-body text-body">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}

function PledgeDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const entry = pledgeIndex.get(id)!
  const focus = entry.p.focus
  const { p, c } = entry.p.ref ? pledgeIndex.get(entry.p.ref)! : entry
  const order = c.pledges.filter((x) => !x.ref)
  const at = order.findIndex((x) => x.id === p.id)
  const prev = order[at - 1]
  const next = order[at + 1]
  const [from] = useState(() => (nav.fromList ? nav.from : 'list'))
  const heading = useRef<HTMLHeadingElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    if (focus)
      afterPaint(() => {
        const el = document.getElementById(`branch-${focus}`)
        if (el && dialog.current) {
          dialog.current.scrollTo({ top: el.getBoundingClientRect().top + dialog.current.scrollTop - 72, behavior: 'instant' })
          flash(el)
        }
      })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, focus])
  const go = (e: MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault()
    location.replace(detailHash(to)) // 이전·다음은 기록을 쌓지 않음 → 뒤로 가기 한 번이면 목록
  }
  const diagrams = (p.blocks ?? []).filter((b) => b.type !== 'text')
  const texts = (p.blocks ?? []).filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text')
  const plan = [...(roadmapByPledge.get(p.id) ?? [])].sort((a, b) => roadmap.periods.indexOf(a.period) - roadmap.periods.indexOf(b.period))
  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="detail-title" className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-white text-ink">
      <div className="gutter sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[720px] items-center">
          <a
            href={from === 'roadmap' ? '#roadmap' : `#${c.id}`}
            onClick={(e) => {
              e.preventDefault()
              onClose()
            }}
            className="back -ml-2 flex items-center gap-1 rounded-lg px-2 py-2 text-[15px] font-semibold"
          >
            <ChevronLeft className="size-5" aria-hidden />
            {from === 'roadmap' ? '월별 추진 일정으로' : `${c.name} 목록으로`}
          </a>
        </div>
      </div>
      <article className="gutter pb-16">
        <div className="mx-auto max-w-[720px] pt-6">
          <p className="t-meta text-muted">
            {c.num} {c.name}
            {p.core ? ' · 메인공약' : ''}
          </p>
          <h2 id="detail-title" ref={heading} tabIndex={-1} className="t-detail mt-2 outline-none">
            {p.detailTitle ?? p.title}
          </h2>
          <p className="t-lead mt-5 rounded-2xl bg-bubble px-5 py-4 font-bold">{p.promise}</p>
          {p.why.length > 0 && (
            <section className="mt-9">
              <h3 className="t-kicker text-orange-ink">왜 필요한가요?</h3>
              <div className="mt-2 space-y-3">
                {p.why.map((w, k) => (
                  <p key={k} className="t-body text-body">
                    <Cite text={w} />
                  </p>
                ))}
              </div>
            </section>
          )}
          {(diagrams.length > 0 || p.how.length > 0) && (
            <section className="mt-9">
              <h3 className="t-kicker text-orange-ink">어떻게 추진하나요?</h3>
              {diagrams.map((b, k) =>
                b.type === 'flow' ? <Flow key={k} steps={b.steps} loop={b.loop} /> : b.type === 'branches' ? <Branches key={k} branches={b.branches} focus={focus} /> : null,
              )}
              {p.how.length > 1 ? (
                <ol className="mt-3 space-y-3">
                  {p.how.map((h, k) => (
                    <li key={k} className="t-body grid grid-cols-[1.75rem_1fr] text-body">
                      <span className="font-bold text-ink tabular-nums">{k + 1}.</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                p.how[0] && <p className="t-body mt-2 text-body">{p.how[0]}</p>
              )}
            </section>
          )}
          {texts.map((t, k) => (
            <section key={k} className="mt-9">
              {t.title && <h3 className="t-kicker text-orange-ink">{t.title}</h3>}
              <div className={`${t.title ? 'mt-2' : ''} space-y-3`}>
                {t.paragraphs.map((x, j) => (
                  <p key={j} className="t-body text-body">
                    {x}
                  </p>
                ))}
              </div>
            </section>
          ))}
          {plan.length > 0 && (
            <section className="mt-9 rounded-2xl bg-paper px-5 py-4">
              <h3 className="t-kicker text-orange-ink">월별 추진 일정에서</h3>
              <ul className="mt-2 space-y-1">
                {plan.map((e) => (
                  <li key={e.period + e.text} className="t-small text-ink">
                    <span className="mr-2 inline-block min-w-[4.5em] font-bold">{e.period}</span>
                    {e.text}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(prev || next) && (
            <nav aria-label="같은 분야의 다른 공약" className="mt-14 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
              {prev ? (
                <a href={detailHash(prev.id)} onClick={(e) => go(e, prev.id)} className="row rounded-xl bg-paper px-4 py-3">
                  <span className="t-meta block text-muted">이전 공약</span>
                  <span className="t-pledge block">{prev.title}</span>
                </a>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next && (
                <a href={detailHash(next.id)} onClick={(e) => go(e, next.id)} className="row rounded-xl bg-paper px-4 py-3 sm:text-right">
                  <span className="t-meta block text-muted">다음 공약</span>
                  <span className="t-pledge block">{next.title}</span>
                </a>
              )}
            </nav>
          )}
        </div>
      </article>
    </div>
  )
}

/* 목록·일정 → 상세 → 뒤로: 브라우저 뒤로 가기와 '목록으로' 모두 연 자리로 돌아오고, 누른 줄에 포커스와 표시 */
function useDetailRoute() {
  const [id, setId] = useState(readDetail)
  const current = useRef(id)
  useEffect(() => {
    const onHash = () => {
      const nextId = readDetail()
      const closing = current.current && !nextId ? current.current : null
      current.current = nextId
      setId(nextId)
      if (!closing) return
      afterPaint(() => {
        if (nav.fromList) window.scrollTo({ top: nav.scrollY, behavior: 'instant' })
        else document.getElementById(pledgeIndex.get(closing)!.c.id)?.scrollIntoView({ behavior: 'instant' })
        const row = nav.opener?.isConnected && nav.opener.offsetParent ? nav.opener : document.querySelector<HTMLElement>(`#pledges [data-pledge="${closing}"]`)
        if (row) {
          const r = row.getBoundingClientRect()
          if (r.top < 64 || r.bottom > window.innerHeight) row.scrollIntoView({ block: 'center', behavior: 'instant' })
          row.focus({ preventScroll: true })
          flash(row)
        }
        nav.fromList = false
        nav.opener = null
      })
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

/* 22면 투표 안내 */
function Vote() {
  return (
    <section id="vote" aria-labelledby="vote-title" className="cover-bg gutter relative scroll-mt-14 overflow-hidden pt-16 sm:pt-24">
      <div className="wrap relative z-10">
        <h2 id="vote-title" className="t-h2">
          여러분의 소중한 한 표가
          <span className="mt-2 flex items-end gap-x-2">
            <img src="figma/slogan-final.png" alt={campaign.slogan} width={994} height={212} className="h-auto w-[min(50vw,360px)]" />
            <span className="shrink-0">이 됩니다.</span>
          </span>
        </h2>
        <div className="mt-9">
          <VoteList size="lg" />
        </div>
      </div>
      <img src="figma/campus-lineart.webp" alt="" width={1080} height={618} loading="lazy" className="relative mx-auto mt-6 h-auto w-full max-w-[1000px] opacity-60" />
    </section>
  )
}

function Footer() {
  return (
    <footer className="gutter border-t border-white/10 bg-[#07061f] py-10 text-white/65">
      <div className="wrap">
        <details>
          <summary className="t-meta flex items-center gap-2 font-semibold text-white/85">
            자료 출처
            <ChevronDown className="chev size-4 transition-transform" aria-hidden />
          </summary>
          <ul className="t-meta mt-4 grid gap-2 sm:grid-cols-2">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-white/25 underline-offset-4 hover:text-white">
                  {s.title}
                </a>
              </li>
            ))}
            <li>2025-1·2025-2·2026-1 학자요구안과 학교 답변, 학교 공지</li>
            <li>동력 정책자료집, 후보 등록 서류(2026. 11. 10.)</li>
          </ul>
        </details>
        <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/10 pt-6">
          <div className="t-meta">
            <p>{campaign.org}</p>
            <p className="mt-1">
              선거 구호 <span className="text-white/90">{campaign.officialSlogan}</span>
            </p>
          </div>
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
          <Candidates />
          <Slogan />
          <Statement />
          <Pledges />
          <Roadmap />
          <Vote />
        </main>
        <Footer />
      </div>
      {detail && <PledgeDetail key={detail} id={detail} onClose={closeDetail} />}
    </>
  )
}

