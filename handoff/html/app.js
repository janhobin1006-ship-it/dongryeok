// 동력 공약 사이트 — 순수 JS 버전 (라이브러리 없음)
// 데이터 읽는 순서: window.PLEDGES_DATA(서버가 직접 넣어준 경우) → window.PLEDGES_URL → ../data/pledges.json
(async function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const pending = (t = '작성 중') => `<span class="pending">${esc(t)}</span>`
  const $ = (id) => document.getElementById(id)

  const data = window.PLEDGES_DATA || (await (await fetch(window.PLEDGES_URL || '../data/pledges.json')).json())
  const { campaign, categories, team } = data
  const all = categories.flatMap((c) => c.pledges.map((p) => ({ ...p, cat: c.name, catId: c.id })))
  const filled = (p) => [p.why, p.how, p.effect].filter(Boolean).length

  // 텍스트 바인딩: data-bind="필드명"
  document.querySelectorAll('[data-bind]').forEach((el) => (el.textContent = campaign[el.dataset.bind] ?? ''))

  // 기호 + 후보 카드
  $('ballot').innerHTML =
    `<div class="num"><span class="mono">기호</span><strong>${esc(campaign.ballotNumber || '—')}</strong>${campaign.ballotNumber ? '' : '<span style="font-size:12px;opacity:.8">추첨 전</span>'}</div>` +
    campaign.candidates.map((c) => `<div><span class="mono">${esc(c.role)}</span><p class="name">${esc(c.name)}</p><p class="dept">${esc(c.dept)} ${esc(c.year)}학번</p></div>`).join('')
  $('vote-date').textContent = campaign.voteDate || '일정 확정 전'

  // 핵심 가치
  $('values').innerHTML = campaign.values
    .map((v, i) => `<div><h3>${v.title ? esc(v.title) : pending(`핵심 가치 ${i + 1}`)}</h3><p>${v.body ? esc(v.body) : pending()}</p></div>`)
    .join('')

  // 진척도
  $('progress').textContent = `${all.length}개 중 ${all.filter((p) => filled(p) === 3).length}개 작성 완료`

  // 공약 탭 + 검색
  const tabs = [{ id: 'all', name: '전체', count: all.length }, ...categories.map((c) => ({ id: c.id, name: c.name, count: c.pledges.length }))]
  const fromHash = location.hash.slice(1)
  let tab = categories.some((c) => c.id === fromHash) ? fromHash : 'all'
  let q = ''

  const chipClass = (f) => (f === '총학 단독 가능' ? 'chip solo' : 'chip')

  function row(p) {
    const n = filled(p)
    const status = n === 3 ? '작성 완료' : n > 0 ? '작성 중' : '초안'
    return `<li class="item">
      <button aria-expanded="false">
        <div class="body">
          ${p.core ? '<span class="badge">핵심공약</span> ' : ''}${tab === 'all' ? `<span class="mono" style="font-size:11px">${esc(p.cat)}</span>` : ''}
          <h3>${esc(p.title)}</h3>
          ${p.summary ? `<p class="sum">${esc(p.summary)}</p>` : ''}
        </div>
        <span class="status${n === 3 ? ' done' : ''}">${status}</span>
        <svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <dl class="detail" hidden>
        <div><dt>필요 이유</dt><dd>${p.why ? esc(p.why) : pending()}</dd></div>
        <div><dt>진행 방안</dt><dd>${p.how ? esc(p.how) : pending()}</dd>${p.feasibility ? `<span class="${chipClass(p.feasibility)}">${esc(p.feasibility)}</span>` : ''}</div>
        <div><dt>기대 효과</dt><dd>${p.effect ? esc(p.effect) : pending()}</dd></div>
      </dl>
    </li>`
  }

  function render() {
    $('tabs').innerHTML = tabs
      .map((t) => `<button class="tab" role="tab" data-tab="${t.id}" aria-selected="${t.id === tab}">${esc(t.name)} <span>${t.count}</span></button>`)
      .join('')
    const cur = categories.find((c) => c.id === tab)
    $('intro').hidden = !cur
    if (cur) $('intro').textContent = cur.intro

    const list = all
      .filter((p) => tab === 'all' || p.catId === tab)
      .filter((p) => !q || (p.title + p.summary + p.why + p.how + p.effect).includes(q))
      .sort((a, b) => Number(!!b.core) - Number(!!a.core))
    $('list').innerHTML = list.map(row).join('')
    $('empty').hidden = list.length > 0
    $('empty').textContent = `‘${q}’에 맞는 공약이 없어요. 다른 단어로 찾아보세요.`
  }

  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]')
    if (!b) return
    tab = b.dataset.tab
    if (tab !== 'all') history.replaceState(null, '', '#' + tab)
    render()
  })
  $('search').addEventListener('input', (e) => { q = e.target.value.trim(); render() })
  $('list').addEventListener('click', (e) => {
    const b = e.target.closest('.item > button')
    if (!b) return
    const li = b.parentElement
    const open = !li.classList.contains('open')
    li.classList.toggle('open', open)
    b.setAttribute('aria-expanded', open)
    li.querySelector('.detail').hidden = !open
  })

  // 선본
  $('team-list').innerHTML = team
    .map((t) => `<div><h3 class="mono" style="font-weight:400">${esc(t.name)}</h3><ul>${t.members.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>`)
    .join('')

  render()
})()
