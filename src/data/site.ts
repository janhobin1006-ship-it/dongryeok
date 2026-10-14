// ─────────────────────────────────────────────
// 공약 사이트 데이터 — 이 파일만 고치면 사이트 내용이 바뀝니다.
// 비어 있는 칸('')은 사이트에 "작성 중"으로 표시됩니다.
// ─────────────────────────────────────────────

export type Feasibility = '총학 단독 가능' | '학교 협의 필요' | '총학 단독 + 학교 협의' | ''

export interface Pledge {
  id: string
  title: string
  summary: string // 한 줄 설명 (노션 초안 메모)
  core?: boolean // 핵심공약 여부
  why: string // 필요 이유
  how: string // 진행 방안
  feasibility: Feasibility
  effect: string // 기대 효과
}

export interface Category {
  id: string
  name: string
  intro: string // 분야 도입글
  pledges: Pledge[]
}

export const campaign = {
  name: '동력',
  hanja: '動力',
  slogan: '동국을 움직이는 힘',
  nameNote: '동국의 ‘동’과 힘 ‘력(力)’을 합친 이름',
  election: '동국대학교 총학생회장단 선거',
  ballotNumber: '', // 기호 확정 시 입력 (예: '1')
  voteDate: '', // 투표일 확정 시 입력 (예: '11. 25. (화) – 11. 27. (목)')
  coreGoal: '학생 복지와 소통을 강화하고, 학생 의견이 학교 운영에 실질적으로 반영되는 구조를 만듭니다.',
  candidates: [
    { role: '정후보', name: '전호빈', dept: '불교학부', year: '24' },
    { role: '부후보', name: '전채희', dept: '광고홍보학과', year: '25' },
  ],
  // 출마의 변 — 핵심 가치 3개 (작성 예정)
  values: [
    { title: '', body: '' },
    { title: '', body: '' },
    { title: '', body: '' },
  ],
}

const p = (id: string, title: string, summary = '', extra: Partial<Pledge> = {}): Pledge => ({
  id,
  title,
  summary,
  why: '',
  how: '',
  feasibility: '',
  effect: '',
  ...extra,
})

export const categories: Category[] = [
  {
    id: 'facility',
    name: '시설',
    intro: '오래된 건물과 생활 시설을 학생 동선에 맞게 고칩니다.',
    pledges: [
      p('lotus', '로터스관 협의체 마련', '사용실 배부, 소음 문제 해결 (방음막 추가 설치 및 교실 이동)'),
      p('sculpture', '조소과 건물 수리·보수', '리모델링 및 환경 개선'),
      p('hakmun-b1', '학술문화관 지하 환경 개선', '예술대와 협의해 실질적인 문제를 파악한 뒤 학교와 협의'),
      p('law-restroom', '법학관 화장실 개선'),
      p('library-hours', '도서관 개방 시간 확대'),
      p('wonheung', '원흥관 시설 개선', '화장실, 아리수 등 복지 및 누수 문제 위주 (공과대와 협의)'),
      p('smoking', '흡연부스 증설', '', {
        why: '건물 출입구 주변 흡연으로 간접흡연 불편이 큽니다. 지정 흡연구역이 부족하고, 위치도 학생 동선과 맞지 않습니다. (구체적 위치 및 수량 확인 필요)',
        how: '흡연구역 전수조사 → 학생 동선 기준 새 위치안 작성 → 시설팀 협의 후 설치',
        feasibility: '총학 단독 + 학교 협의',
        effect: '1학기 내 부스 설치, 학기말에 출입구 흡연 민원 감소 여부 공개',
      }),
      p('union-hall', '학생회관 냉난방·화장실 개선', '냉방 문제 및 위생 시설 개선'),
      p('rooftop', '옥상정원 보수 및 개방 활성화', '휴게 시설 조성, 시범 운영(가오픈)'),
      p('dorm', '기숙사 시설 보수', '헬스장 등'),
    ],
  },
  {
    id: 'academic',
    name: '학술',
    intro: '수업, 학사 제도, 장학까지 공부하는 환경을 손봅니다.',
    pledges: [
      p('seminar', '세미나 개편'),
      p('open-major', '열린전공학부 정식 인정 및 학부 연계 지원'),
      p('video-lecture', '영상강의 수강 인원 확대', '군 e러닝 증설, 군 계절학기 증설'),
      p('contract-dept', '계약학과(학부) 신설'),
      p('liberal-abs', '교양 절대평가 도입'),
      p('gosi', '고시반 개선 및 증설'),
      p('tuition-committee', '등록금심의위원회 학부 자문위원'),
      p('summer-survey', '계절학기 수요조사 및 반영'),
      p('buddhist-scholar', '불교계 장학금 연계'),
      p('reserve', '예비군 학습권 보장'),
      p('exchange', '교환학생 확대 및 학생 의견 반영'),
    ],
  },
  {
    id: 'welfare',
    name: '소통·복지',
    intro: '학생 목소리가 닿는 창구를 늘리고, 캠퍼스 생활을 편하게 만듭니다.',
    pledges: [
      p('festival-budget', '축제 예산 확보', '중구청 지원, 기업 후원'),
      p('picnic-day', '캠퍼스 피크닉 데이', '하루 차량을 통제하고 학교 일일행사 진행'),
      p('festival-content', '축제 3일 신규 콘텐츠 도입', '대운동장 에어바운스(물놀이) 등'),
      p('delivery', '건물별 배달존 마련'),
      p('town-hall', '총장·총학생회장 정기 간담회'),
      p('sports', '시즌별 스포츠 단체관람', '장충체육관, FC서울 등'),
      p('parking', '주차권 제휴', '재계약 여부 확인 필요'),
      p('shuttle', '셔틀 운영 시간 수요조사 및 증편', '최적 시간대 증편'),
    ],
  },
]

// 공개 사이트에는 노션에서 '확정'으로 표시된 인원만 둡니다. 팀원 명단은 확정되면 추가하세요.
export const team = [
  { name: '정후보', members: ['전호빈'] },
  { name: '부후보', members: ['전채희'] },
  { name: '선본장', members: ['강민경'] },
]
