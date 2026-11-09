// 공개 공약 데이터의 원본은 handoff/data/pledges.json 하나입니다 (피그마 최종 목차·카드뉴스 문구 기준).
// 이전 노션 데이터(예산·지표·일정)는 handoff/data/internal/에 보존하고, 사이트에서는 읽지 않습니다.
import data from '../../handoff/data/pledges.json'

export interface Pledge {
  id: string
  title: string
  core?: boolean
  promise: string
  why: string[]
  how: string[]
}

export interface Category {
  id: string
  no: string
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

export const campaign = data.campaign
export const candidates = data.campaign.candidates as Candidate[]
export const categories = data.categories as Category[]
export const sources = data.sources
export const team = data.team
