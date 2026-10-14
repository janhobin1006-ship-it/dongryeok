// 공약 데이터의 원본은 handoff/data/pledges.json 하나입니다.
// React 사이트, 순수 HTML 버전, PHP·Python 예제가 모두 이 파일을 읽습니다.
// 내용을 바꿀 때는 JSON만 고치세요. 빈칸('')은 사이트에 "작성 중"으로 표시됩니다.
import data from '../../handoff/data/pledges.json'

export type Feasibility = '총학 단독 가능' | '학교 협의 필요' | '총학 단독 + 학교 협의' | ''

export interface Pledge {
  id: string
  title: string
  summary: string
  core?: boolean
  why: string
  how: string
  feasibility: Feasibility
  effect: string
}

export interface Category {
  id: string
  name: string
  intro: string
  pledges: Pledge[]
}

export const campaign = data.campaign
export const categories = data.categories as Category[]
export const team = data.team
