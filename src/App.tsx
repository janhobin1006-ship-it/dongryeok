import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { budgetFacts, campaign, categories, roadmap, sources, team, type Category, type Pledge } from './data/site'

const { vote } = campaign
const total = categories.reduce((n, c) => n + c.pledges.length, 0)
const circled = '❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯'

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

function Header() {
  const links = [
    ['#slogan', '슬로건'],
    ['#pledges', '공약'],
    ['#candidates', '후보'],
    ['#vote', '투표'],
  ]
  return (
    <header className="gutter sticky top-0 z-30 border-b border-white/10 bg-navy/85 backdrop-blur-md">
      <div className="wrap flex h-14 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2 font-extrabold tracking-[-0.04em]" aria-label="동력 처음으로">
          <img src="figma/logo-orange.svg" alt="" className="logo h-7 w-auto" />
          <span className="text-lg">동력</span>
        </a>
        <nav className="flex gap-4 text-[14px] text-white/75 sm:gap-7 sm:text-[15px]">
          {links.map(([href, t]) => (
            <a key={href} href={href} className="py-2 hover:text-white">
              {t}
            </a>
          ))}
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

function Hero() {
  const [lead, vice] = campaign.candidates
  return (
    <section id="top" className="texture gutter overflow-hidden pt-12 sm:pt-20">
      <div className="wrap">
        <div className="grid items-start gap-8 sm:grid-cols-2 sm:gap-10">
          <img src="figma/logo-orange.svg" alt="동력 로고" className="logo w-[min(44vw,210px)] sm:ml-[10%] sm:w-[min(30vw,320px)]" />
          <div className="sm:pt-3">
            <VoteInfo large />
          </div>
        </div>

        <h1 className="mt-10 sm:mt-14">
          <img src="figma/slogan-hand.png" alt={campaign.tagline} className="mx-auto w-full max-w-[900px]" />
        </h1>

        <div className="relative mx-auto mt-6 max-w-[880px]">
          <img
            src="photos/duo-cross-cut.webp"
            alt={`${lead.role} ${lead.name}, ${vice.role} ${vice.name}`}
            className="mx-auto w-[min(100%,540px)]"
          />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-navy" />
          <div className="absolute inset-x-0 bottom-6 flex justify-between gap-4 sm:static sm:contents">
            <p className="sm:absolute sm:top-[34%] sm:left-0">
              <span className="block text-sm font-medium text-white/80 sm:text-lg">{lead.role}</span>
              <span className="block text-4xl font-semibold tracking-[-0.04em] [text-shadow:0_2px_12px_rgba(11,9,49,.8)] sm:text-6xl">{lead.name}</span>
            </p>
            <p className="text-right sm:absolute sm:top-[50%] sm:right-0">
              <span className="block text-sm font-medium text-white/80 sm:text-lg">{vice.role}</span>
              <span className="block text-4xl font-semibold tracking-[-0.04em] [text-shadow:0_2px_12px_rgba(11,9,49,.8)] sm:text-6xl">{vice.name}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="wrap flex items-center justify-center gap-2 border-t border-white/10 py-5 text-[13px] text-white/75 sm:text-[15px]">
        <span>{campaign.org}</span>
        <img src="figma/logo-white.svg" alt="" className="logo h-4 w-auto sm:h-5" />
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

function Pill({ no, name }: { no: string; name: string }) {
  return (
    <div className="pill">
      <span className="num size-14 text-[26px] sm:size-20 sm:text-[38px]">{no}</span>
      <h2 className="bar py-3 text-[clamp(1.35rem,5vw,2.5rem)] sm:py-4">{name}</h2>
    </div>
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
      <h4 className="text-[13px] font-bold text-muted">왜 필요한가</h4>
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
      <h4 className="text-[13px] font-bold text-muted">이렇게 하겠습니다</h4>
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

function MainPledge({ p, n }: { p: Pledge; n: number }) {
  return (
    <article id={`pledge-${p.id}`} className="grid scroll-mt-20 gap-6 md:grid-cols-[190px_1fr] md:gap-8">
      <div>
        <div className="tab px-5 py-4 text-[19px] md:flex md:min-h-[150px] md:items-center md:justify-center md:px-5 md:text-center md:text-[21px]">
          <span>
            <span className="mb-1 block text-[12px] font-semibold tracking-normal text-orange">메인공약 {n}</span>
            {p.title}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="rounded-[22px] bg-bubble px-5 py-4 text-center text-[17px] leading-snug font-bold md:text-[19px]">{p.summary}</p>
        <div className="mt-6 grid gap-7 lg:grid-cols-2">
          <Why items={p.why} />
          <How items={p.how} />
        </div>
        <div className="mt-6">
          <Meta p={p} />
        </div>
      </div>
    </article>
  )
}

function ExtraPledge({ p, i }: { p: Pledge; i: number }) {
  return (
    <li id={`pledge-${p.id}`} className="scroll-mt-20">
      <details>
        <summary className="flex items-start gap-3 py-4">
          <span className="mt-[1px] text-[22px] leading-none text-navy" aria-hidden>
            {circled[i]}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16.5px] font-bold">{p.title}</span>
            <span className="mt-0.5 block text-[14.5px] leading-snug text-body">{p.summary}</span>
          </span>
          <ChevronDown className="chev mt-1 size-5 shrink-0 text-muted transition-transform" aria-hidden />
        </summary>
        <div className="space-y-5 pb-6 pl-[34px]">
          <Why items={p.why} />
          <How items={p.how} />
          <Meta p={p} />
        </div>
      </details>
    </li>
  )
}

const cardPhoto: Record<string, { src: string; alt: string; className: string }> = {
  academic: {
    src: 'figma/duo-desk.png',
    alt: '책상에서 함께 공약을 정리하는 전호빈·전채희 후보',
    className: 'mx-auto mt-8 w-[min(100%,300px)] md:absolute md:top-5 md:right-8 md:mt-0 md:w-[230px]',
  },
  connect: {
    src: 'figma/duo-gesture.png',
    alt: '손으로 동력의 ‘ㄷ’을 만드는 전호빈·전채희 후보',
    className: 'mx-auto mt-10 w-[min(100%,320px)]',
  },
}

function CategoryBlock({ c }: { c: Category }) {
  const mains = c.pledges.filter((p) => p.core)
  const extras = c.pledges.filter((p) => !p.core)
  const photo = cardPhoto[c.id]
  return (
    <div id={c.id} className="scroll-mt-14">
      <div className="divider relative overflow-hidden">
        <img
          src="figma/campus-lineart-cover.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 w-[max(140%,900px)] max-w-none -translate-x-1/2 opacity-55 sm:w-[min(1500px,120%)]"
        />
        <div className="gutter">
          <Reveal className="wrap relative pt-16 pb-[clamp(170px,30vw,340px)] sm:pt-24">
            <p className="text-[clamp(4.2rem,13vw,8rem)] leading-none font-light tracking-[-0.06em]">{c.no}</p>
            <h2 className="mt-1 text-[clamp(2rem,6.4vw,3.8rem)] font-medium">{c.name}</h2>
            <p className="mt-4 max-w-[36rem] text-white/80">{c.intro}</p>
          </Reveal>
        </div>
      </div>

      <div className="gutter relative pt-8 pb-16 sm:pb-20">
        <div className="wrap relative rounded-[28px] bg-white px-4 pt-5 pb-8 text-ink sm:px-8 sm:pt-7 md:px-10 md:pb-10">
          {photo && c.id === 'academic' && <img src={photo.src} alt={photo.alt} className={`hidden md:block ${photo.className}`} />}
          <div className="md:max-w-[640px]">
            <Pill no={c.no} name={c.name} />
          </div>

          {c.method && (
            <div className="mt-8 rounded-2xl bg-paper p-4 sm:p-5">
              <p className="text-[13px] font-bold text-muted">시설 공약은 모두 이 순서로 진행합니다</p>
              <ol className="mt-3 grid gap-2 sm:grid-cols-4 sm:gap-3">
                {c.method.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14.5px] leading-snug font-semibold">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange text-[12px] text-navy">{i + 1}</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-10 space-y-14">
            {mains.map((p, i) => (
              <MainPledge key={p.id} p={p} n={i + 1} />
            ))}
          </div>

          {photo && c.id === 'academic' && <img src={photo.src} alt={photo.alt} className={`md:hidden ${photo.className}`} />}

          <div className="mt-14">
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-navy pb-2">
              <h3 className="text-xl font-bold">추가 공약</h3>
              <span className="text-sm text-muted tabular-nums">{extras.length}개 · 눌러서 자세히</span>
            </div>
            <ul className="divide-y divide-line border-b border-line">
              {extras.map((p, i) => (
                <ExtraPledge key={p.id} p={p} i={i} />
              ))}
            </ul>
          </div>

          {photo && c.id === 'connect' && <img src={photo.src} alt={photo.alt} className={photo.className} />}

          <img src="figma/logo-navy.svg" alt="" className="logo mt-8 h-8 w-auto" />
        </div>
      </div>
    </div>
  )
}

function Pledges() {
  return (
    <section id="pledges" className="scroll-mt-14">
      <div className="gutter pt-4 pb-14">
        <Reveal className="wrap">
          <Label>공약</Label>
          <h2 className="mt-3 text-[clamp(1.9rem,5vw,3rem)] leading-tight font-bold">세 가지 힘, 공약 {total}개</h2>
          <p className="mt-3 max-w-[40rem] text-white/75">분야마다 메인공약 2개와 추가 공약으로 나눴습니다. 모든 공약에 근거와 예산, 이행을 점검할 지표를 붙였습니다.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="group rounded-2xl border border-white/15 bg-block/40 px-5 py-4 transition-colors hover:border-orange"
              >
                <span className="text-sm font-semibold text-orange">{c.no}</span>
                <span className="mt-1 block text-xl font-bold">{c.name}</span>
                <span className="mt-1 block text-sm text-white/65 tabular-nums">
                  메인공약 2 · 추가 공약 {c.pledges.length - 2}
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
      {categories.map((c) => (
        <CategoryBlock key={c.id} c={c} />
      ))}
    </section>
  )
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
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Slogan />
        <Statement />
        <Pledges />
        <Budget />
        <Candidates />
        <Vote />
      </main>
      <Footer />
    </>
  )
}
