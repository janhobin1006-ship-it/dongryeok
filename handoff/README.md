# 동력 공약 사이트 · 개발 인수인계

선거운동본부 **동력**의 공약 사이트 초안입니다. Claude로 빠르게 만든 버전이라, 디자인팀이 피그마로 다듬고 프론트팀이 HTML + PHP 또는 Python으로 최종본을 만드는 걸 전제로 정리했습니다.

- 지금 돌아가는 사이트: https://janhobin1006-ship-it.github.io/dongryeok/
- 저장소: https://github.com/janhobin1006-ship-it/dongryeok (오른쪽 위 **Code → Download ZIP**으로 통째로 받기)

## 1. 한눈에 보기

| 폴더 | 무엇 | 누가 쓰나 |
| --- | --- | --- |
| `handoff/data/pledges.json` | **공약 데이터 원본.** 모든 버전이 이 파일 하나를 읽음 | 전원 (내용 수정은 여기서만) |
| `handoff/html/` | 순수 HTML·CSS·JS 버전. 라이브러리 없음 | 프론트 |
| `handoff/php/` | PHP 예제 (페이지 + JSON API) | 백엔드(PHP) |
| `handoff/python/` | Python Flask 예제 (페이지 + JSON API) | 백엔드(Python) |
| `handoff/design-tokens.json` | 색·글꼴·크기 토큰. CSS 변수와 이름 같음 | 디자인 |
| `src/` | 지금 배포된 React 버전 (참고용) | 필요할 때만 |

**추천 진행**: `handoff/html/`을 출발점으로 삼고, 서버는 PHP나 Python 예제 중 하나를 고르세요. React 버전은 몰라도 됩니다.

## 2. 바로 실행해 보기

ZIP을 받아 압축을 풀고 `handoff` 폴더에서 셋 중 하나를 실행합니다.

```bash
# 순수 HTML (서버 없이 보기만)
python3 -m http.server 8000
# → http://localhost:8000/html/
```

```bash
# PHP
php -S localhost:8000 -t .
# → http://localhost:8000/php/        페이지
# → http://localhost:8000/php/api.php  JSON (?category=facility)
```

```bash
# Python (Flask)
cd python
pip install -r requirements.txt
python app.py
# → http://localhost:8000/             페이지
# → http://localhost:8000/api/pledges  JSON (?category=academic)
```

`index.html`을 더블클릭으로 열면 공약이 안 뜹니다. 브라우저가 `file://`에서 JSON 읽기를 막기 때문이니 꼭 위처럼 서버로 여세요.

## 3. 페이지 구조 (피그마 프레임과 맞춰 주세요)

위에서 아래로 한 줄 흐름입니다. HTML의 `<section id>`가 그대로 프레임 이름입니다.

| 순서 | id | 내용 | 데이터 |
| --- | --- | --- | --- |
| 0 | `header` | 상단 고정 바: 로고 + 출마의 변/공약/선본 이동 | `campaign.name` |
| 1 | `top` | 큰 로고 '동력', 動力 한자 외곽선, 슬로건, 기호·정후보·부후보 카드, 투표일 | `campaign.*` |
| 2 | `why` | 핵심 목표 문장 + 핵심 가치 3칸 | `campaign.coreGoal`, `campaign.values` |
| 3 | `pledges` | 분야 탭(전체/시설/학술/소통·복지), 검색, 공약 목록(눌러서 펼침) | `categories` |
| 4 | `team` | 선거운동본부 | `team` |

공약 한 줄을 펼치면 **필요 이유 · 진행 방안 · 기대 효과** 3칸이 나오고, 진행 방안 아래에 실행 주체 칩(총학 단독 가능 / 학교 협의 필요)이 붙습니다. 오른쪽 상태 배지(초안 / 작성 중 / 작성 완료)는 세 칸이 얼마나 채워졌는지로 자동 계산됩니다.

## 4. 데이터 구조 (`pledges.json`)

DB로 옮겨도 API가 이 모양 그대로 돌려주면 프론트 코드는 손댈 필요가 없습니다.

```jsonc
{
  "campaign": {
    "name": "동력", "slogan": "동국을 움직이는 힘", "tagline": "동국을 움직이는 힘을 만들다",
    "election": "...", "org": "...", "nameNote": "...", "coreGoal": "...",
    "ballotNumber": "",        // 기호 확정 시 "1" 등 (비어 있으면 표시 안 함)
    "vote": { "period": "11월 24일(화) – 11월 26일(목)", "time": "", "method": "...", "note": "..." },
    "statement": { "title": "...", "paragraphs": ["..."] },   // 기조문
    "values": [{ "key": "먼저", "title": "움직이겠습니다", "body": "..." }],   // 3개
    "candidates": [{ "role": "정후보", "name": "...", "dept": "...", "year": "24", "extra": "...",
                     "photo": "photos/hobin.jpg", "history": [{ "year": "2024", "items": ["..."] }] }]
  },
  "categories": [{
    "id": "facility", "no": "01", "name": "시설을 바꾸는 힘", "short": "시설", "intro": "...",
    "method": ["..."],         // 선택: 분야 공통 진행 방식
    "pledges": [{
      "id": "lotus-council",   // 영문 고유값, URL에 써도 됨
      "core": true,            // true면 메인공약
      "title": "로터스관 협의체 마련",
      "promise": "핵심 약속 한 문장",
      "why": ["왜 필요한가요? (출처)"],   // 없으면 빈 배열 → 화면에서 생략
      "how": ["어떻게 추진하나요?"]       // 없으면 빈 배열 → 화면에서 생략
    }]
  }],
  "sources": [{ "title": "...", "url": "https://..." }],
  "team": [{ "name": "선거운동본부장", "members": ["..."] }]
}
```

DB로 옮길 때 테이블은 이렇게 나누면 JSON과 바로 맞습니다.

```sql
CREATE TABLE categories (id VARCHAR(32) PRIMARY KEY, no VARCHAR(4), name VARCHAR(50), intro TEXT, sort INT);
CREATE TABLE pledges (
  id VARCHAR(64) PRIMARY KEY, category_id VARCHAR(32) REFERENCES categories(id),
  title VARCHAR(200), core BOOLEAN DEFAULT FALSE,
  promise TEXT, why JSON, how JSON, sort INT
);
```

## 5. 디자인 토큰

`html/style.css` 맨 위 `:root`의 CSS 변수와 `design-tokens.json`이 같은 값입니다. 피그마에서 색을 바꾸면 이 두 곳만 고치면 사이트 전체가 바뀝니다. 다크 모드 값도 들어 있습니다.

- 글꼴: 제목 Black Han Sans, 본문 IBM Plex Sans KR, 라벨·숫자 IBM Plex Mono (모두 Google Fonts, 무료)
- 포인트 색은 코발트 하나. 칩의 초록/주황은 '실행 주체'라는 의미 전용입니다.
- 로고가 확정되면 `#top`의 `<h1>` 글자를 로고 이미지로 바꾸면 됩니다.

## 6. 바이브 코딩으로 수정할 때 쓰는 프롬프트

Claude 같은 AI에 이 폴더를 올리고 아래처럼 시키면 구조를 깨지 않고 고칠 수 있습니다.

```text
handoff/html/ 의 공약 사이트를 수정해줘.
- 데이터는 handoff/data/pledges.json 구조를 그대로 유지해 (키 이름 바꾸지 말 것)
- 색은 style.css 의 :root CSS 변수만 바꿔
- 라이브러리 추가 없이 순수 HTML/CSS/JS로
수정할 내용: (여기에 피그마 시안 설명이나 스크린샷)
```

```text
handoff/php/api.php 를 MySQL에서 읽도록 바꿔줘.
테이블은 README 4번의 categories, pledges 구조야.
응답 JSON 모양은 handoff/data/pledges.json 과 똑같아야 해.
```

## 7. 공개 전 체크리스트

- [ ] 선거시행세칙: 공식 선거운동 기간 전 온라인 공개가 허용되는지 확인
- [ ] 기호, 투표일, 선거 회차 입력 (`campaign.ballotNumber`, `campaign.vote`)
- [ ] 핵심 가치 3개, 핵심공약 지정(`core: true`)
- [ ] 선본원 명단: 지금은 노션에서 '확정'된 3명만 공개
- [ ] 공약 문구 최종본 반영 (정책자료집과 같은 문구인지 대조)
- [ ] 모바일(폭 400px)과 다크 모드에서 화면 확인

> 11/13 최종: 공약명·순서는 11/10 후보 등록 공약 41개(시설 15·배움 10·모두 16), 문안·도식·예산 계획·로드맵은 정책자료집 22면 기준. 등록서에서 둘로 나뉜 로터스관은 `lotus-noise`가 `ref`/`focus`로 `lotus-council` 상세의 소음 갈래를 엽니다. 메인공약 도식은 `blocks`(flow·branches·text), 월별 추진 일정은 `roadmap`(시기 6칸 × 분야 3행, `[문구](공약id)`는 상세 링크).
> 11/9 노션 최종본 반영: 메인 6 + 추가 38. 통합된 공약의 예전 id는 `aliases`(`lotus-noise`→`lotus-council`, `reserve-bus`→`homecoming-bus`)로 합쳐진 공약에 연결합니다. `tuition`은 배움 → 잇는 힘 메인으로 옮겼고 id는 그대로입니다.
> 11/9: 예산·지표·일정은 공개 데이터에서 뺐습니다. 이전 데이터는 `data/internal/`에 보존되어 있고 사이트는 읽지 않습니다.
