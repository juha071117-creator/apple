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
