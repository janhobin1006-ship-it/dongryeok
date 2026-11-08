// 공약 데이터의 원본은 handoff/data/pledges.json 하나입니다.
// React 사이트, 순수 HTML 버전, PHP·Python 예제가 모두 이 파일을 읽습니다.
// 내용을 바꿀 때는 JSON만 고치세요.
import data from '../../handoff/data/pledges.json'

export interface Pledge {
  id: string
  title: string
  summary: string
  core?: boolean
  why: string[]
  how: string[]
  budget: string
  measure: string
}

export interface Category {
  id: string
  no: string
  name: string
  short: string
  intro: string
  method?: string[]
  pledges: Pledge[]
}

export interface Candidate {
  role: string
  name: string
  dept: string
  year: string
  extra: string
  photo: string
  history: { year: string; items: string[] }[]
}

export const campaign = data.campaign
export const candidates = data.campaign.candidates as Candidate[]
export const categories = data.categories as Category[]
export const budgetFacts = data.budgetFacts
export const roadmap = data.roadmap
export const sources = data.sources
export const team = data.team
