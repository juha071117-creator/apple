
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#ffffff" />
<title>스터디메이트 - 와이어프레임 프로토타입</title>
<style>
  :root {
    --ink:#111; --muted:#666; --line:#222; --soft:#f4f4f4; --paper:#fff;
    --radius:16px; --shadow:0 12px 40px rgba(0,0,0,.10);
  }
  * { box-sizing:border-box; }
  body {
    margin:0; background:#ededed; color:var(--ink);
    font-family:system-ui,-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;
  }
  button, input, select { font:inherit; }
  button { cursor:pointer; }
  .stage { min-height:100vh; display:flex; flex-direction:column; align-items:center; padding:26px 16px 40px; }
  .project-head { width:min(1120px,100%); display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:22px; }
  .project-head h1 { font-size:clamp(17px,2.2vw,26px); margin:0; font-weight:850; letter-spacing:-.8px; }
  .project-head h1 span { font-weight:500; }
  .project-tag { border:1.5px solid #222; border-radius:999px; padding:8px 14px; font-size:12px; white-space:nowrap; background:#fff; }
  .device {
    width:min(430px,100%); min-height:780px; height:min(850px,calc(100vh - 130px));
    background:var(--paper); border:2px solid #171717; border-radius:34px;
    box-shadow:var(--shadow); overflow:hidden; display:flex; flex-direction:column; position:relative;
  }
  .status { height:34px; flex:none; display:flex; align-items:center; justify-content:space-between; padding:0 18px; font-size:13px; font-weight:650; }
  .status-icons { display:flex; gap:4px; align-items:center; }
  .signal { width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:13px solid #111; }
  .battery { width:17px;height:12px;border:2px solid #111;border-radius:3px; position:relative; }
  .battery:after { content:""; position:absolute; right:-4px; top:3px; width:2px;height:4px;background:#111; }
  .screen { display:none; flex:1; min-height:0; overflow:auto; padding:18px 18px 14px; }
  .screen.active { display:block; }
  .screen.splash { display:none; padding:0 18px 30px; }
  .screen.splash.active { display:flex; flex-direction:column; }
  .topbar { display:flex; align-items:center; justify-content:space-between; margin:4px 0 22px; }
  .topbar h2 { margin:0; font-size:21px; letter-spacing:-.7px; }
  .icon-btn { border:0; background:transparent; font-size:24px; padding:4px; line-height:1; }
  .greeting { font-size:18px; line-height:1.45; margin:4px 0 20px; font-weight:700; }
  .greeting small { display:block; font-size:15px; font-weight:500; }
  .panel { border:1.5px solid #777; border-radius:15px; padding:14px; margin-bottom:16px; background:#fff; }
  .panel-title { display:flex; align-items:center; gap:9px; font-weight:800; margin-bottom:12px; }
  .symbol { font-size:20px; width:22px; text-align:center; }
  .progress-line { display:flex; align-items:center; gap:10px; }
  .track { height:11px; border:1.5px solid #333; border-radius:99px; flex:1; overflow:hidden; }
  .fill { height:100%; background:#111; border-radius:99px; transition:width .25s; }
  .small { font-size:12px; color:#444; white-space:nowrap; }
  .task { display:flex; align-items:center; gap:10px; padding:9px 0; border-top:1px solid #ddd; font-size:13px; }
  .task:first-of-type { border-top:0; }
  .task input { appearance:none; width:21px; height:21px; border:1.7px solid #222; border-radius:5px; margin:0; flex:none; }
  .task input:checked { background:#111; }
  .task input:checked:after { content:"✓"; color:white; display:block; text-align:center; line-height:18px; font-weight:800; }
  .task label { flex:1; }
  .chev { font-size:20px; }
  .quick-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin:18px 0; }
  .quick { min-height:78px; border:1.5px solid #555; border-radius:13px; background:white; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font-size:12px; font-weight:700; }
  .quick b { font-size:23px; line-height:1; }
  .week-progress { padding:11px 12px; }
  .week-progress .progress-line { margin-top:7px; }
  .bottom-nav { flex:none; height:62px; border-top:1px solid #bbb; display:grid; grid-template-columns:repeat(5,1fr); background:#fff; }
  .nav-item { border:0; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; color:#555; font-size:11px; font-weight:650; }
  .nav-item .nav-icon { font-size:21px; line-height:1.1; filter:grayscale(1); }
  .nav-item.active { color:#000; font-weight:900; }
  .nav-item.active .nav-icon { filter:none; }
  .segmented { display:flex; border:1.5px solid #555; border-radius:13px; overflow:hidden; margin:2px 0 22px; }
  .segmented button { flex:1; min-height:38px; border:0; border-right:1px solid #aaa; background:#fff; font-size:13px; font-weight:650; }
  .segmented button:last-child { border-right:0; }
  .segmented button.selected { background:#050505; color:#fff; }
  .field-label { display:block; font-weight:800; font-size:14px; margin:18px 0 8px; }
  select, .select-like { width:100%; border:1.5px solid #555; border-radius:12px; padding:11px 12px; background:#fff; font-weight:650; }
  .chips { display:flex; gap:7px; }
  .chip { flex:1; border:1.5px solid #555; border-radius:999px; background:#fff; padding:9px 4px; font-size:13px; font-weight:650; }
  .chip.selected { background:#050505; color:white; }
  .primary { width:100%; border:1.5px solid #111; background:#050505; color:white; border-radius:12px; padding:13px; font-weight:800; margin-top:28px; }
  .hint { border:1.5px solid #777; border-radius:13px; padding:13px; margin-top:18px; display:flex; gap:10px; font-size:13px; line-height:1.6; }
  .calendar-head { display:flex; align-items:center; justify-content:space-between; margin:16px 0 10px; }
  .calendar-head strong { font-size:17px; }
  .calendar { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; text-align:center; font-size:12px; }
  .calendar div { padding:7px 0; }
  .weekday { font-weight:800; color:#555; }
  .day { border:0; border-radius:50%; background:white; aspect-ratio:1; }
  .day.selected { background:#050505; color:white; }
  .day.has-event:after { content:""; display:block; width:3px;height:3px;border-radius:50%;background:#111;margin:1px auto 0; }
  .event-date { display:flex; align-items:center; justify-content:space-between; font-weight:800; margin:20px 0 8px; }
  .event { border:1.3px solid #888; border-radius:12px; padding:11px; font-size:12px; display:flex; gap:8px; margin-top:-1px; }
  .dot { width:9px;height:9px;border-radius:50%;background:#111; margin-top:4px; flex:none; }
  .event strong { display:block; font-size:13px; margin-bottom:2px; }
  .summary-grid { display:grid; grid-template-columns:repeat(3,1fr); border:1.5px solid #555; border-radius:12px; overflow:hidden; margin:12px 0 22px; }
  .summary-grid div { text-align:center; padding:9px 3px; border-right:1px solid #aaa; }
  .summary-grid div:last-child { border:0; }
  .summary-grid small { display:block; font-size:11px; }
  .summary-grid strong { display:block; font-size:15px; margin-top:3px; }
  .bar-chart { height:116px; display:flex; align-items:flex-end; justify-content:space-around; border-bottom:1px solid #333; padding:8px 4px 0; gap:8px; }
  .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:5px; font-size:11px; }
  .bar { width:min(26px,75%); background:#111; border-radius:4px 4px 0 0; min-height:5px; }
  .ratio { display:flex; align-items:center; gap:18px; padding:10px 0; }
  .donut { width:112px;height:112px;border-radius:50%; background:conic-gradient(#111 0 40%,#555 40% 65%,#888 65% 85%,#ddd 85% 100%); display:grid; place-items:center; flex:none; }
  .donut:after { content:"자료구조\\A40%"; white-space:pre; text-align:center; font-size:13px; font-weight:800; line-height:1.5; width:76px;height:76px;border-radius:50%;background:white;display:grid;place-content:center; }
  .legend { font-size:12px; line-height:2; }
  .legend span { display:inline-block; width:8px;height:8px;background:#111;border-radius:2px;margin-right:7px; }
  .splash-logo { margin:auto 0; text-align:center; }
  .book { font-size:100px; line-height:1.2; margin-bottom:18px; }
  .splash-logo h2 { font-size:31px; margin:0 0 18px; letter-spacing:-1.5px; }
  .splash-logo p { line-height:1.65; margin:0; font-size:16px; }
  .splash-actions { display:grid; gap:9px; }
  .outline { width:100%; border:1.5px solid #111; background:#fff; border-radius:11px; padding:12px; font-weight:800; }
  .back { border:0; background:transparent; font-size:23px; padding:0 8px 0 0; }
  .screen-title { display:flex; align-items:center; gap:10px; margin-bottom:22px; }
  .screen-title h2 { margin:0; font-size:21px; }
  .toast { position:absolute; left:18px; right:18px; bottom:75px; background:#111; color:white; padding:12px; border-radius:12px; text-align:center; font-size:13px; opacity:0; transform:translateY(8px); transition:.2s; pointer-events:none; }
  .toast.show { opacity:1; transform:translateY(0); }
  @media (max-width:520px) {
    body { background:#fff; }
    .stage { padding:0; }
    .project-head { display:none; }
    .device { width:100%; height:100dvh; min-height:620px; border:0; border-radius:0; box-shadow:none; }
    .status { height:32px; }
  }
  .brand{display:inline-block;text-decoration:none;cursor:pointer;border:0;background:none;color:#000;padding:0;font-size:21px;font-weight:850;letter-spacing:-.7px;text-align:left}.brand:focus-visible{outline:2px solid #000}.section-name{font-size:13px;font-weight:750;border:1px solid #111;padding:5px 8px;border-radius:7px}.text-field{width:100%;border:1.5px solid #111;border-radius:10px;background:#fff;color:#000;padding:12px;font:inherit}textarea.text-field{resize:vertical}.mini-plan{border-top:1px solid #000;padding:10px 0;font-size:13px;line-height:1.6}body,.device,.panel,.quick,.hint{box-shadow:none!important}body{background:#fff} .device{border-color:#000} .screen{color:#000}
</style>
</head>
<body>
<div class="stage">
  <header class="project-head">
    <h1>스터디메이트 (ver.0.2) <span>– 프로젝트 기준선 와이어프레임</span></h1>
    <div class="project-tag">흑백(Black &amp; White) · 평면형(HI-FI 전 단계)</div>
  </header>

  <main class="device" aria-label="스터디메이트 모바일 앱 프로토타입">
    <div class="status"><span>12:30</span><span class="status-icons"><span class="signal"></span><span class="signal"></span><span class="battery"></span></span></div>

    <section class="screen splash active" id="splash">
      <div class="splash-logo">
        <div class="book">▱</div>
        <h2>스터디메이트</h2>
        <p>나에게 맞춘<br>학습 계획과 문제,<br>일정까지 한 번에!</p>
      </div>
      <div class="splash-actions">
        <button class="primary" style="margin:0" onclick="showScreen('home')">시작하기</button>
        <button class="outline" onclick="notify('로그인 화면은 다음 단계에서 연결할 수 있습니다.')">로그인</button>
      </div>
    </section>

    <section class="screen" id="home">
      <div class="topbar"><h2><a class="brand" href="#home" data-home-link aria-label="스터디메이트 홈으로 이동">스터디메이트</a></h2><button class="icon-btn" onclick="notify('새로운 알림이 없습니다.')">♧</button></div>
      <p class="greeting">나연님,<small>오늘도 조금 더 공부해볼까요?</small></p>
      <div class="panel">
        <div class="panel-title"><span class="symbol">▣</span>오늘의 학습 계획</div>
        <div class="progress-line"><div class="track"><div class="fill" id="todayFill" style="width:33%"></div></div><span class="small" id="taskCount">1 / 3 완료</span></div>
        <div class="task"><input type="checkbox" id="t1" checked onchange="updateTasks()"><label for="t1">자료구조 개념 복습 (30분)</label><span class="chev">›</span></div>
        <div class="task"><input type="checkbox" id="t2" onchange="updateTasks()"><label for="t2">연결리스트 문제 2개 (30분)</label><span class="chev">›</span></div>
        <div class="task"><input type="checkbox" id="t3" onchange="updateTasks()"><label for="t3">컴퓨터구조 정리 (30분)</label><span class="chev">›</span></div>
      </div>
      <div class="quick-grid">
        <button class="quick" onclick="showScreen('study')"><b>▤</b>문제 풀기</button>
        <button class="quick" onclick="showScreen('study');setStudyMode('hint')"><b>✧</b>개념 힌트</button>
        <button class="quick" onclick="showScreen('schedule')"><b>▦</b>일정</button>
        <button class="quick" onclick="showScreen('stats')"><b>▥</b>학습 통계</button>
      </div>
      <div class="quick-grid" style="grid-template-columns:repeat(3,1fr);margin-top:0"><button class="quick" onclick="showScreen('materials')"><b>▧</b>내 자료</button><button class="quick" onclick="showScreen('planner')"><b>▤</b>AI 학습계획</button><button class="quick" onclick="showScreen('share')"><b>⇄</b>계획 공유</button></div>
       <div class="panel week-progress"><div class="progress-line"><strong>이번 주 진행률</strong><span style="margin-left:auto;font-weight:800">60%</span></div><div class="progress-line"><div class="track"><div class="fill" style="width:60%"></div></div></div></div>
    </section>

    <section class="screen" id="study">
      <div class="screen-title"><button class="back" onclick="showScreen('home')">←</button><h2><a class="brand" href="#home" data-home-link aria-label="스터디메이트 홈으로 이동">스터디메이트</a></h2><span class="section-name">학습</span></div>
      <div class="segmented" id="studyTabs">
        <button class="selected" onclick="setStudyMode('quiz')">문제 풀기</button><button onclick="setStudyMode('hint')">개념 힌트</button>
      </div>
      <label class="field-label" for="subject">주제 선택</label>
      <input id="subject" class="text-field" placeholder="예: 자료구조, 자바 프로그래밍" aria-label="과목명 직접 입력">
      <div class="field-label">문제 유형</div>
      <div class="chips" id="types"><button class="chip selected" onclick="chooseChip(this,'types')">객관식</button><button class="chip" onclick="chooseChip(this,'types')">주관식</button><button class="chip" onclick="chooseChip(this,'types')">코딩</button></div>
      <div class="field-label">문제 수</div>
      <div class="chips" id="counts"><button class="chip selected" onclick="chooseChip(this,'counts')">5개</button><button class="chip" onclick="chooseChip(this,'counts')">10개</button><button class="chip" onclick="chooseChip(this,'counts')">15개</button></div>
      <button class="primary" onclick="generateQuestions()">문제 생성하기 ✦</button>
      <button class="outline" style="margin-top:12px" onclick="showScreen('materials')">내 자료에서 학습하기</button><div class="hint"><span style="font-size:22px">✧</span><span id="studyHint">AI가 선택한 주제에 맞춰 문제와 해설을 생성해줘요.</span></div>
      <div id="questionResult"></div>
    </section>

    <section class="screen" id="schedule">
      <div class="topbar"><h2><a class="brand" href="#home" data-home-link aria-label="스터디메이트 홈으로 이동">스터디메이트</a></h2><span class="section-name">일정</span></div>
      <div class="segmented"><button class="selected" onclick="selectSegment(this)">캠퍼스 일정</button><button onclick="selectSegment(this)">개인 일정</button></div>
      <div class="calendar-head"><button class="icon-btn" onclick="changeMonth(-1)">‹</button><strong id="monthLabel">2026년 10월</strong><button class="icon-btn" onclick="changeMonth(1)">›</button></div>
      <div class="calendar" id="calendar"></div>
      <div class="event-date"><span id="selectedDate">10월 27일 (화)</span><button class="icon-btn" onclick="notify('일정 추가 기능을 선택했습니다.')">＋</button></div>
      <div class="event"><span class="dot"></span><div><strong>12:00 – 13:30　강의동 A · 공부+식사</strong></div></div>
      <div class="event"><span class="dot"></span><div><strong>15:00 – 16:00　자료구조 과제</strong></div></div>
    </section>

    <section class="screen" id="stats">
      <div class="screen-title"><button class="back" onclick="showScreen('home')">←</button><h2><a class="brand" href="#home" data-home-link aria-label="스터디메이트 홈으로 이동">스터디메이트</a></h2><span class="section-name">학습 통계</span></div>
      <div class="segmented"><button class="selected" onclick="selectSegment(this)">주간</button><button onclick="selectSegment(this)">월간</button><button onclick="selectSegment(this)">전체</button></div>
      <strong>이번 주 학습 요약</strong>
      <div class="summary-grid"><div><small>총 학습시간</small><strong>4시간 30분</strong></div><div><small>문제 풀이</small><strong>28문제</strong></div><div><small>완료율</small><strong>75%</strong></div></div>
      <div class="field-label">학습 시간 추이</div>
      <div class="bar-chart">
        <div class="bar-col"><div class="bar" style="height:47%"></div>월</div><div class="bar-col"><div class="bar" style="height:20%"></div>화</div><div class="bar-col"><div class="bar" style="height:38%"></div>수</div><div class="bar-col"><div class="bar" style="height:55%"></div>목</div><div class="bar-col"><div class="bar" style="height:78%"></div>금</div><div class="bar-col"><div class="bar" style="height:17%"></div>토</div><div class="bar-col"><div class="bar" style="height:36%"></div>일</div>
      </div>
      <div class="field-label">주제별 학습 비율</div>
      <div class="ratio"><div class="donut"></div><div class="legend"><div><span></span>자료구조　40%</div><div><span style="background:#555"></span>운영체제　25%</div><div><span style="background:#888"></span>컴퓨터구조　20%</div><div><span style="background:#ddd"></span>기타　15%</div></div></div>
    </section>

    <section class="screen" id="materials"><div class="topbar"><h2><a class="brand" href="#home" data-home-link aria-label="스터디메이트 홈으로 이동">스터디메이트</a></h2><span class="section-name">내 자료</span></div>
      <div class="panel"><div class="panel-title">학습자료 등록</div><label class="field-label" for="materialSubject">과목명</label><input class="text-field" id="materialSubject" placeholder="예: 자료구조"><label class="field-label" for="materialFile">파일 첨부</label><input class="text-field" type="file" id="materialFile" accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.md"><button class="primary" onclick="addMaterial()">내 자료에 추가</button><p class="small">파일명만 임시로 목록에 저장됩니다. 실제 문서 분석은 별도 연결이 필요합니다.</p></div><div class="panel"><div class="panel-title">등록한 자료</div><div id="materialList">등록한 자료가 없습니다.</div></div>
    </section>
    <section class="screen" id="planner"><div class="topbar"><h2><a class="brand" href="#home" data-home-link aria-label="스터디메이트 홈으로 이동">스터디메이트</a></h2><span class="section-name">AI 학습계획</span></div>
      <label class="field-label" for="planSubject">과목명</label><input class="text-field" id="planSubject" placeholder="예: 운영체제"><label class="field-label" for="examDate">시험일</label><input class="text-field" id="examDate" type="date"><label class="field-label" for="studyTime">하루 공부 가능 시간</label><input class="text-field" id="studyTime" type="number" min="0.5" max="24" step="0.5" placeholder="예: 2 (시간)"><label class="field-label" for="personalSchedule">개인 일정 및 학습 제약</label><textarea class="text-field" id="personalSchedule" rows="3" placeholder="예: 월·수 수업 18시까지, 토요일 아르바이트"></textarea><label class="field-label" for="planGoal">학습 목표</label><input class="text-field" id="planGoal" placeholder="예: 중간고사 대비 개념 복습"><button class="primary" onclick="makePlan()">맞춤 학습계획 미리보기</button><div id="planResult"></div>
    </section>
    <section class="screen" id="share"><div class="topbar"><h2><a class="brand" href="#home" data-home-link aria-label="스터디메이트 홈으로 이동">스터디메이트</a></h2><span class="section-name">계획 공유</span></div><p class="small">학교가 달라도 유사한 과목의 계획을 참고할 수 있어요.</p><label class="field-label" for="shareSearch">과목명으로 검색</label><input class="text-field" id="shareSearch" placeholder="예: 자료구조"><button class="outline" style="margin-top:10px" onclick="searchPlans()">비슷한 과목 찾기</button><div id="shareResults" class="panel" style="margin-top:18px">과목명을 입력해 검색해보세요.</div><button class="primary" onclick="publishPlan()">내 학습계획 공유하기</button><p class="small">현재는 예시 데이터 기반의 공유 흐름입니다. 실제 게시·검색 기능은 서버 연결 후 가능합니다.</p></section>
    <section class="screen" id="profile"><div class="topbar"><h2><a class="brand" href="#home" data-home-link aria-label="스터디메이트 홈으로 이동">스터디메이트</a></h2><span class="section-name">내정보</span></div><div class="panel"><div class="panel-title">학습 프로필</div><label class="field-label">학교 (선택)</label><input class="text-field" placeholder="학교명"><label class="field-label">전공 (선택)</label><input class="text-field" placeholder="전공명"><button class="primary" onclick="notify('프로필 저장은 추후 연결됩니다.')">저장하기</button></div><button class="outline" onclick="showScreen('materials')">내 자료 관리</button></section>
    <nav class="bottom-nav" id="bottomNav" style="display:none">
      <button class="nav-item active" data-screen="home" onclick="showScreen('home')"><span class="nav-icon">⌂</span>홈</button>
      <button class="nav-item" data-screen="study" onclick="showScreen('study')"><span class="nav-icon">◇</span>학습</button>
      <button class="nav-item" data-screen="schedule" onclick="showScreen('schedule')"><span class="nav-icon">▦</span>일정</button>
      <button class="nav-item" data-screen="stats" onclick="showScreen('stats')"><span class="nav-icon">▥</span>통계</button>
      <button class="nav-item" data-screen="profile" onclick="showScreen('profile')"><span class="nav-icon">♙</span>내정보</button>
    </nav>
    <div class="toast" id="toast" role="status"></div>
  </main>
</div>
<script>
  const screens = ['splash','home','study','schedule','stats','materials','planner','share','profile'];
  function showScreen(name) {
    if (!screens.includes(name)) return;
    screens.forEach(id => {
      const screen = document.getElementById(id);
      screen.classList.toggle('active', id === name);
      if (id === name) screen.scrollTop = 0;
    });
    const nav = document.getElementById('bottomNav');
    nav.style.display = name === 'splash' ? 'none' : 'grid';
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.screen === name));
  }
  function notify(message) {
    const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
  }
  function updateTasks() {
    const checks = [...document.querySelectorAll('#home .task input')];
    const done = checks.filter(c => c.checked).length;
    document.getElementById('todayFill').style.width = (done / checks.length * 100) + '%';
    document.getElementById('taskCount').textContent = `${done} / ${checks.length} 완료`;
  }
  function chooseChip(button, group) {
    document.querySelectorAll(`#${group} .chip`).forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');
  }
  function setStudyMode(mode) {
    const buttons = document.querySelectorAll('#studyTabs button');
    buttons[0].classList.toggle('selected', mode === 'quiz');
    buttons[1].classList.toggle('selected', mode === 'hint');
    document.getElementById('studyHint').textContent = mode === 'hint'
      ? '선택한 주제의 핵심 개념과 이해를 돕는 힌트를 확인해보세요.'
      : 'AI가 선택한 주제에 맞춰 문제와 해설을 생성해줘요.';
    document.getElementById('questionResult').innerHTML = '';
  }
  function generateQuestions() {
    const subject = document.getElementById('subject').value.trim(); if(!subject){notify('과목명을 입력해주세요.');document.getElementById('subject').focus();return;}
    const type = document.querySelector('#types .selected').textContent;
    const count = document.querySelector('#counts .selected').textContent;
    document.getElementById('questionResult').innerHTML =
      `<div class="panel" style="margin-top:16px"><strong>생성 요청 완료</strong><p style="font-size:13px;line-height:1.6;margin-bottom:0">${subject} · ${type} · ${count}<br>실제 AI 문제 생성 API를 연결하면 이 영역에 문제가 표시됩니다.</p></div>`;
    notify(`${subject} ${count} 문제 설정을 적용했습니다.`);
  }
  function selectSegment(button) {
    button.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');
  }
  let calendarMonth = 9, calendarYear = 2026;
  function renderCalendar() {
    const names = ['일','월','화','수','목','금','토'];
    const first = new Date(calendarYear, calendarMonth, 1).getDay();
    const days = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    document.getElementById('monthLabel').textContent = `${calendarYear}년 ${calendarMonth+1}월`;
    const cal = document.getElementById('calendar');
    cal.innerHTML = names.map(n => `<div class="weekday">${n}</div>`).join('');
    for(let i=0;i<first;i++) cal.innerHTML += '<div></div>';
    for(let d=1;d<=days;d++) {
      const selected = d === 27 && calendarMonth === 9 && calendarYear === 2026;
      cal.innerHTML += `<button class="day ${selected?'selected':''} ${[12,21,27].includes(d)?'has-event':''}" onclick="pickDate(${d})">${d}</button>`;
    }
  }
  function changeMonth(delta) {
    calendarMonth += delta;
    if(calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    if(calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  }
  function pickDate(day) {
    document.querySelectorAll('.day').forEach(b => b.classList.remove('selected'));
    [...document.querySelectorAll('.day')].find(b => b.textContent == day)?.classList.add('selected');
    const date = new Date(calendarYear, calendarMonth, day);
    document.getElementById('selectedDate').textContent = `${calendarMonth+1}월 ${day}일 (${['일','월','화','수','목','금','토'][date.getDay()]})`;
  }
  const storedMaterials=[]; let lastPlan=null;
  function addMaterial(){const name=document.getElementById('materialSubject').value.trim(),file=document.getElementById('materialFile').files[0];if(!name||!file){notify('과목명과 파일을 모두 입력해주세요.');return;}storedMaterials.push({name,file:file.name});document.getElementById('materialList').textContent=storedMaterials.map(m=>m.name+' — '+m.file).join(' / ');notify('파일명이 자료 목록에 추가되었습니다.');}
  function makePlan(){const subject=document.getElementById('planSubject').value.trim(),date=document.getElementById('examDate').value,hours=Number(document.getElementById('studyTime').value),schedule=document.getElementById('personalSchedule').value.trim(),goal=document.getElementById('planGoal').value.trim();if(!subject||!date||!hours){notify('과목, 시험일, 공부 가능 시간을 입력해주세요.');return;}const days=Math.ceil((new Date(date+'T00:00:00')-new Date())/86400000);if(days<1){notify('미래의 시험일을 선택해주세요.');return;}lastPlan={subject,date,hours,schedule,goal};document.getElementById('planResult').innerHTML='<div class="panel" style="margin-top:16px"><strong>학습계획 예시 · '+escapeHTML(subject)+'</strong><div class="mini-plan">시험까지 약 '+days+'일 · 하루 '+hours+'시간</div><div class="mini-plan">1단계: 핵심 개념 및 강의자료 정리</div><div class="mini-plan">2단계: 단원별 문제 풀이와 개념 힌트</div><div class="mini-plan">3단계: 오답 복습 및 시험 직전 점검</div><p class="small">일정: '+escapeHTML(schedule||'입력 없음')+'<br>목표: '+escapeHTML(goal||'입력 없음')+'<br>※ 실제 GPT 최적화가 아닌 와이어프레임 예시입니다.</p></div>';}
  function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function searchPlans(){const q=document.getElementById('shareSearch').value.trim();document.getElementById('shareResults').innerHTML=q?'<strong>'+escapeHTML(q)+' 관련 계획 (예시)</strong><div class="mini-plan">타 대학 학습자 A · 개념 → 문제 → 오답 복습</div><div class="mini-plan">타 대학 학습자 B · 주 3회 문제 풀이 계획</div><p class="small">실제 사용자 게시물은 아닙니다.</p>':'과목명을 입력해주세요.';}
  function publishPlan(){notify(lastPlan?'계획 공유 화면 예시입니다. 실제 게시 기능은 연결 전입니다.':'먼저 AI 학습계획 화면에서 계획을 만들어주세요.');}
  // 모든 화면의 브랜드 제목에서 홈으로 이동 (동적 화면에서도 동작)
  document.addEventListener('click', function(event) {
    const homeLink = event.target.closest('[data-home-link]');
    if (!homeLink) return;
    event.preventDefault();
    showScreen('home');
  });
  renderCalendar();
</script>
</body>
</html>
