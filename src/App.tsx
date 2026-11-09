import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { campaign, candidates, categories, sources, type Category, type Pledge } from './data/site'

const { vote } = campaign
const all = categories.flatMap((c) => c.pledges)
const coreCount = all.filter((p) => p.core).length
const pledgeIndex = new Map(categories.flatMap((c) => c.pledges.map((p, i) => [p.id, { p, c, i }] as const)))

/* 공약 상세는 #/p/<id> 해시 화면. 목록은 그대로 둔 채 위에 덮어서, 돌아오면 보던 분야와 스크롤 위치가 그대로 남는다. */
const detailHash = (id: string) => `#/p/${id}`
const readDetail = () => {
  const m = location.hash.match(/^#\/p\/([\w-]+)$/)
  return m && pledgeIndex.has(m[1]) ? m[1] : null
}
const nav = { fromList: false, scrollY: 0 }
if ('scrollRestoration' in history) history.scrollRestoration = 'manual' // 돌아올 때 위치는 직접 복원
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
  const m = text.match(/^(.*?)\s*\(([^()]+)\)$/)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]} <span className="t-meta whitespace-nowrap text-muted">— {m[2]}</span>
    </>
  )
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
      <div className="wrap flex h-14 items-center justify-between gap-4">
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
          className="menu-btn -mr-2 flex items-center gap-1.5 rounded-lg px-2 py-2 text-[15px] font-semibold md:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          메뉴
        </button>
        <nav aria-label="주 메뉴" className="max-md:absolute max-md:inset-x-0 max-md:top-14">
          <ul id="site-menu" className={`${open ? 'block' : 'hidden'} border-b border-white/10 bg-navy px-4 pb-2 md:flex md:gap-7 md:border-0 md:bg-transparent md:p-0`}>
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

function VoteList({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const rows = [
    ['투표기간', vote.period],
    ...(vote.time ? [['투표시간', vote.time]] : []),
    ['투표방법', vote.method],
  ]
  return (
    <dl className={size === 'lg' ? 'space-y-5' : 'space-y-1'}>
      {rows.map(([k, v]) => (
        <div key={k} className={size === 'lg' ? '' : 'flex gap-2.5'}>
          <dt className={`h-fit shrink-0 bg-orange font-bold text-navy ${size === 'lg' ? 'inline-block px-3 py-0.5 text-[15px]' : 'px-1.5 text-[13px]'}`}>{k}</dt>
          <dd className={size === 'lg' ? 't-lead mt-2 text-white' : 't-meta text-[14.5px] text-white/85 md:text-base'}>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* 표지: 선본 이름 → 공식 손글씨(피그마 최종본, 한 번만) → 두 후보 → 공약 보기.
   두 사람은 정면을 보고 어깨가 안쪽으로 모여 있다 → 제목은 인물 옆 빈 열에 두고 얼굴과 한 얼굴 폭 이상 띄운다. */
function Hero() {
  const [lead, vice] = candidates
  return (
    <section id="top" aria-label="표지" className="texture gutter overflow-hidden">
      <div className="wrap grid gap-x-12 pt-6 md:grid-cols-[1fr_minmax(0,540px)] md:pt-12">
        <div className="md:col-start-1 md:row-start-1 md:self-end">
          <img src="figma/logo-orange.svg" alt="" className="logo mb-7 hidden w-[120px] md:block" />
          <p className="t-cover-org">{campaign.org}</p>
          <h1 className="mt-4 md:mt-6">
            <img src="figma/slogan-final.png" alt={campaign.slogan} width={994} height={212} className="h-auto w-[min(100%,440px)] md:w-[min(100%,480px)]" />
          </h1>
        </div>

        <figure className="relative mx-auto mt-5 w-full max-w-[400px] md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:max-w-[540px]">
          <div className="h-[min(74vw,340px)] overflow-hidden md:h-auto">
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
                <span className="block text-[28px] leading-tight font-bold tracking-[0.06em] [text-shadow:0_2px_10px_rgba(11,9,49,.9)] md:text-[40px]">{c.name}</span>
              </p>
            ))}
          </figcaption>
        </figure>

        <div className="mt-5 pb-6 md:col-start-1 md:row-start-2 md:mt-8 md:self-start md:pb-16">
          <a href="#pledges" className="cta inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3.5 text-[17px] font-bold text-navy">
            공약 보기 <ChevronDown className="size-5" aria-hidden />
          </a>
          <div className="mt-4">
            <VoteList />
          </div>
        </div>
      </div>
    </section>
  )
}

/* 목차: 피그마 최종 목차처럼 분야명(주황) → 메인공약 1·2(주황) → 추가 공약(흰색). 줄 전체가 링크. */
function openFromList(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  nav.fromList = true
  nav.scrollY = window.scrollY
}

function PledgeRow({ p, n }: { p: Pledge; n?: number }) {
  return (
    <a href={detailHash(p.id)} data-pledge={p.id} onClick={openFromList} className={`row -mx-2 flex items-start gap-2 rounded-md px-2 py-2.5 ${p.core ? 'text-orange' : 'text-white'}`}>
      {n && <span className="t-pledge-main w-5 shrink-0 tabular-nums">{n}.</span>}
      <span className={`min-w-0 flex-1 ${p.core ? 't-pledge-main' : 't-pledge'}`}>
        {p.core && <span className="sr-only">메인공약 </span>}
        {p.title}
      </span>
      <ChevronRight className="mt-[3px] size-4 shrink-0 opacity-40" aria-hidden />
    </a>
  )
}

function CategoryToc({ c }: { c: Category }) {
  const mains = c.pledges.filter((p) => p.core)
  const extras = c.pledges.filter((p) => !p.core)
  return (
    <section id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-16">
      <h3 id={`${c.id}-title`} className="t-section text-orange">
        <span className="mr-2.5 font-black">{c.no}</span>
        {c.name}
      </h3>
      <ol className="mt-3">
        {mains.map((p, i) => (
          <li key={p.id}>
            <PledgeRow p={p} n={i + 1} />
          </li>
        ))}
      </ol>
      <ul className="mt-3 border-t border-white/15">
        {extras.map((p) => (
          <li key={p.id} className="border-b border-white/10">
            <PledgeRow p={p} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Pledges() {
  return (
    <section id="pledges" aria-labelledby="pledges-title" className="gutter scroll-mt-14 pt-10 pb-16 sm:pt-14 sm:pb-24">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-white/30 pb-4">
          <h2 id="pledges-title" className="t-h2">
            {campaign.tocTitle}
          </h2>
          <p className="t-meta text-white/75">
            메인공약 {coreCount}개와 추가 공약 {all.length - coreCount}개 · 공약명을 누르면 자세히 볼 수 있습니다
          </p>
        </div>
        <div className="mt-8 grid gap-12 lg:grid-cols-3 lg:gap-10">
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
        <div className="mx-auto flex h-14 max-w-[680px] items-center">
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
        <div className="mx-auto max-w-[680px] pt-6">
          <p className="t-meta text-muted">
            {c.no} {c.name}
            {p.core ? ' · 메인공약' : ''}
          </p>
          <h2 id="detail-title" ref={heading} tabIndex={-1} className="t-detail mt-2 outline-none">
            {p.title}
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
          {p.how.length > 0 && (
            <section className="mt-9">
              <h3 className="t-kicker text-orange-ink">어떻게 추진하나요?</h3>
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
                <p className="t-body mt-2 text-body">{p.how[0]}</p>
              )}
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

/* 목록 → 상세 → 뒤로: 브라우저 뒤로 가기와 '목록으로' 모두 같은 자리로, 방금 읽은 줄이 화면에 보이도록 돌아온다 */
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
        const row = document.querySelector<HTMLElement>(`[data-pledge="${closing}"]`)
        if (row) {
          const r = row.getBoundingClientRect()
          if (r.top < 64 || r.bottom > window.innerHeight) row.scrollIntoView({ block: 'center', behavior: 'instant' })
          row.focus({ preventScroll: true })
          row.classList.add('just-read')
          setTimeout(() => row.classList.remove('just-read'), 2200)
        }
        nav.fromList = false
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

function Slogan() {
  return (
    <section id="slogan" aria-labelledby="slogan-title" className="gutter scroll-mt-14 bg-white py-14 text-ink sm:py-20">
      <div className="wrap">
        <Reveal>
          <p className="t-kicker text-orange-ink">슬로건</p>
          <h2 id="slogan-title" className="t-h2 mt-2 max-w-[24ch]">
            {campaign.sloganSub}
          </h2>
          <p className="t-body mt-4 max-w-[62ch] text-body">{campaign.nameNote}</p>
        </Reveal>
        <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {campaign.values.map((v) => (
            <li key={v.key} className="border-t-2 border-ink pt-4">
              <p className="text-[34px] leading-none font-black tracking-[-0.04em] text-orange">{v.key}</p>
              <p className="t-pledge mt-2">{v.title}</p>
              <p className="t-body mt-2 text-body">{v.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Statement() {
  const { title, paragraphs } = campaign.statement
  return (
    <section id="statement" aria-labelledby="statement-title" className="gutter scroll-mt-14 py-16 sm:py-24">
      <div className="wrap grid gap-8 md:grid-cols-[minmax(0,360px)_1fr] md:gap-16">
        <div>
          <p className="t-kicker text-orange">기조문</p>
          <h2 id="statement-title" className="t-h2 mt-2">
            {title}
          </h2>
        </div>
        <div className="max-w-[62ch] space-y-5">
          {paragraphs.map((t, i) => (
            <p key={i} className={`t-body ${i === paragraphs.length - 1 ? 'font-semibold text-white' : 'text-white/80'}`}>
              {t}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 후보 소개: 두 사진은 눈높이·얼굴 크기를 맞춘 같은 규격. 사진 아래 작은 주황 직책 → 큰 네이비 이름 → 학과·학번 → 보조 정보 */
function Candidates() {
  return (
    <section id="candidates" aria-labelledby="candidates-title" className="gutter scroll-mt-14 bg-white py-14 text-ink sm:py-20">
      <div className="wrap">
        <h2 id="candidates-title" className="t-h2">
          후보 소개
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-8 md:gap-12">
          {candidates.map((c) => (
            <figure key={c.name}>
              <div className="overflow-hidden rounded-2xl bg-paper md:max-w-[320px]">
                <img src={c.photo} alt={`${c.role} ${c.name}`} width={720} height={1000} loading="lazy" className="h-auto w-full" />
              </div>
              <figcaption className="mt-4">
                <p className="t-kicker text-orange-ink">{c.role}</p>
                <p className="t-name mt-0.5">{c.name}</p>
                <p className="t-pledge mt-1">
                  {c.dept} {c.year}학번
                </p>
                <p className="t-meta mt-0.5 text-muted">{c.minor}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-12">
          {candidates.map((c) => (
            <section key={c.name} aria-labelledby={`bio-${c.name}`}>
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
          ))}
        </div>
      </div>
    </section>
  )
}

/* 투표 안내: 피그마 최종 투표안내 구성. 캠퍼스 선화는 지면을 맺는 여기 한 곳에만 */
function Vote() {
  return (
    <section id="vote" aria-labelledby="vote-title" className="texture gutter scroll-mt-14 overflow-hidden pt-16 sm:pt-24">
      <div className="wrap relative z-10">
        <h2 id="vote-title" className="t-h2">
          여러분의 소중한 한 표가
          <br />
          <span className="text-orange">동국을 움직일 힘</span>이 됩니다.
        </h2>
        <div className="mt-8">
          <VoteList size="lg" />
        </div>
      </div>
      <img src="figma/campus-lineart.webp" alt="" width={1080} height={618} loading="lazy" className="relative mx-auto mt-6 h-auto w-full max-w-[1000px] opacity-90" />
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
          </ul>
        </details>
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="t-meta">{campaign.org}</p>
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
          <Candidates />
          <Vote />
        </main>
        <Footer />
      </div>
      {detail && <PledgeDetail key={detail} id={detail} onClose={closeDetail} />}
    </>
  )
}
