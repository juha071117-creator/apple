# StudyMate

스터디메이트(StudyMate)는 개인의 학습 시간과 일정을 바탕으로 1주 학습 계획을 만들고 관리할 수 있는 모바일 웹 프로토타입입니다.

## 주요 기능

- 학습 과목과 시험일 입력
- 요일별 공부 가능 시간 설정
- 개인 일정과 겹치지 않는 학습 시간 배치
- 30분 단위 학습 계획 생성
- 학습 완료 상태 관리
- 일자별 학습 일정 확인
- 학습 계획 공유용 정보 생성

## 프로젝트 구조

```text
StudyMate_Project/
├── index.html              # 앱 진입 페이지
├── README.md               # 프로젝트 소개
├── .gitignore              # Git 제외 파일 설정
├── LICENSE                 # MIT License
├── css/
│   └── style.css           # 스타일
├── js/
│   └── app.js              # 앱 동작 로직
├── data/
│   └── README.md           # 데이터 파일 안내
└── assets/
    ├── README.md           # 정적 리소스 안내
    └── images/             # 이미지 리소스
```

## 실행 방법

별도의 서버 설치 없이 실행할 수 있습니다.

1. 프로젝트를 다운로드하거나 Clone합니다.
2. `index.html` 파일을 웹 브라우저에서 엽니다.

일부 브라우저 기능이나 향후 API 연동을 위해 로컬 개발 서버 사용을 권장합니다.

## GitHub에 올리는 방법

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

## 기술 구성

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage

## 라이선스

이 프로젝트는 MIT License를 따릅니다.


## Google Sheets 연동

- Google Apps Script 웹 앱 주소는 `js/main.js`, `js/app.js`, `index.html`에 설정되어 있습니다.
- 학습계획 저장 시 `POST` 요청으로 JSON 데이터를 전송합니다.
- 브라우저의 CORS 제한 때문에 `no-cors` 방식으로 요청하므로 화면에서 서버의 실제 처리 결과를 판독할 수 없습니다. Google 스프레드시트에서 행이 추가되었는지 확인해야 합니다.
- Apps Script 배포 설정에서 웹 앱 접근 권한을 앱 사용자가 접근할 수 있도록 설정하고, `doPost(e)`가 요청 본문의 JSON을 읽어 시트에 기록하도록 구성되어 있어야 합니다.
- 이 프로젝트 파일에는 Apps Script 서버 코드가 포함되어 있지 않으므로, 시트 탭 이름과 열 구조 및 `doPost(e)` 구현은 배포된 스크립트 설정에 따릅니다.


## 탐색 탭 Google Sheets 연동

탐색 탭은 아래 시트를 사용합니다. `Code.gs`를 Apps Script 프로젝트에 반영한 뒤 `setupStudyMateSheets()`를 1회 실행하면 시트가 준비됩니다.

- `explore_plans`: 학습계획, 진도율, 즐겨찾기
- `explore_ai_quizzes`: AI 문제지, 선택지, 정답, 해설, 즐겨찾기
- `join`: 회원가입 정보
- `posts`, `comments`, `likes`: 커뮤니티 데이터

웹 앱 배포 주소는 `index.html`에 설정되어 있습니다. 배포된 Apps Script의 기존 코드를 새 `Code.gs`로 교체한 뒤 **배포 > 배포 관리 > 수정 > 새 버전**으로 업데이트해야 실제 저장이 작동합니다. 브라우저의 `no-cors` 요청은 서버 응답을 읽을 수 없으므로 저장 여부는 구글 시트에서 확인합니다.
