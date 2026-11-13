// 공개 공약 데이터의 원본은 handoff/data/pledges.json 하나입니다.
// 공약명·순서·문안·도식·예산 계획·로드맵: 피그마 '발주 물품_정책 자료집' 22면(최종본) / 근거·세부 실행: 11/9 노션 최종본
import data from '../../handoff/data/pledges.json'

export interface Step {
  title?: string
  tag?: string
  body?: string
  chips?: { t: string; body: string }[]
}
export type Block =
  | { type: 'flow'; steps: Step[]; loop?: string }
  | { type: 'branches'; branches: { id: string; label: string; title: string; steps: Step[] }[] }
  | { type: 'text'; title: string; paragraphs: string[] }

export interface Pledge {
  id: string
  title: string
  core?: boolean
  promise: string
  why: string[]
  how: string[]
  blocks?: Block[]
  detailTitle?: string
  /** 등록서에서 따로 적힌 공약이 자료집의 다른 공약 상세 안에서 설명될 때 */
  ref?: string
  focus?: string
  /** 목차에는 없고 주소로만 여는 항목(예: 로터스관 소음 갈래) */
  hidden?: boolean
}

export interface Category {
  id: string
  no: string
  num: string
  name: string
  short: string
  pledges: Pledge[]
}

export interface Candidate {
  role: string
  name: string
  dept: string
  year: string
  minor: string
  origin: string
  photo: string
  history: { year: string; items: string[] }[]
}

export interface Roadmap {
  periods: string[]
  rows: Record<string, string[][]>
}

export const campaign = data.campaign
export const candidates = data.campaign.candidates as Candidate[]
export const categories = data.categories as unknown as Category[]
export const roadmap = data.roadmap as Roadmap
export const sources = data.sources
export const team = data.team
// 통합된 공약의 예전 상세 주소(#/p/<옛 id>)를 합쳐진 공약으로 보냅니다
export const aliases = data.aliases as Record<string, string>
