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
    "name": "동력", "hanja": "動力", "slogan": "동국을 움직이는 힘",
    "nameNote": "...", "election": "동국대학교 총학생회장단 선거",
    "ballotNumber": "",        // 기호 확정 시 "1" 등
    "voteDate": "",            // 예: "11. 25. (화) – 11. 27. (목)"
    "coreGoal": "...",
    "candidates": [{ "role": "정후보", "name": "...", "dept": "...", "year": "24" }],
    "values": [{ "title": "", "body": "" }]   // 3개
  },
  "categories": [{
    "id": "facility", "name": "시설", "intro": "...",
    "pledges": [{
      "id": "smoking",         // 영문 고유값, URL에 써도 됨
      "title": "흡연부스 증설",
      "summary": "한 줄 메모",
      "core": false,           // true면 '핵심공약' 배지 + 목록 맨 위
      "why": "", "how": "", "effect": "",
      "feasibility": ""        // "총학 단독 가능" | "학교 협의 필요" | "총학 단독 + 학교 협의" | ""
    }]
  }],
  "team": [{ "name": "선본장", "members": ["..."] }]
}
```

빈 문자열(`""`)은 화면에 "작성 중"으로 나옵니다. 공약을 채우면 진척도("29개 중 n개 작성 완료")가 자동으로 올라갑니다.

DB로 옮길 때 테이블은 이렇게 나누면 JSON과 바로 맞습니다.

```sql
CREATE TABLE categories (id VARCHAR(32) PRIMARY KEY, name VARCHAR(50), intro TEXT, sort INT);
CREATE TABLE pledges (
  id VARCHAR(64) PRIMARY KEY, category_id VARCHAR(32) REFERENCES categories(id),
  title VARCHAR(200), summary TEXT, core BOOLEAN DEFAULT FALSE,
  why TEXT, how TEXT, effect TEXT, feasibility VARCHAR(30), sort INT
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
- [ ] 기호, 투표일, 선거 회차 입력 (`campaign.ballotNumber`, `voteDate`)
- [ ] 핵심 가치 3개, 핵심공약 지정(`core: true`)
- [ ] 선본원 명단: 지금은 노션에서 '확정'된 3명만 공개
- [ ] 공약 문구 최종본 반영 (정책자료집과 같은 문구인지 대조)
- [ ] 모바일(폭 400px)과 다크 모드에서 화면 확인
