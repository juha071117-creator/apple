// D-Day 데이터 목록
let ddayList = [
  { id: 1, title: '정보처리기사 필기', days: 'D-18', color: 'indigo' },
  { id: 2, title: '수능 6월 모의평가', days: 'D-85', color: 'rose' }
];

const categoryHashtags = {
  all: ['#자격증합격', '#N수생', '#기출회독', '#전공필수', '#내신대비', '#독학'],
  cert: ['#자격증합격', '#기출회독', '#실기대비', '#취업스펙', '#요약집'],
  nstudy: ['#N수생', '#수능1등급', '#6모대비', '#의치약한', '#재수생'],
  univ: ['#전공필수', '#족보', '#PPT요약', '#팀프로젝트'],
  high: ['#내신대비', '#수능모의고사', '#수행평가']
};

window.onload = () => {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 50;
    document.getElementById('loading-bar').style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
      }, 300);
    }
  }, 150);

  renderDdays();
  renderHashtags('all');
};

function renderDdays() {
  const homeDday = document.getElementById('home-dday-list');
  const mypageDday = document.getElementById('mypage-dday-list');
  
  const html = ddayList.map(item => `
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
      <div>
        <div class="text-[11px] font-bold text-slate-800 truncate max-w-[90px]">${item.title}</div>
        <div class="text-[9px] text-slate-400">목표 일정</div>
      </div>
      <span class="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">${item.days}</span>
    </div>
  `).join('');

  if(homeDday) homeDday.innerHTML = html;
  if(mypageDday) mypageDday.innerHTML = html;
}

function openAddDdayModal() { document.getElementById('dday-modal').classList.remove('hidden'); }
function closeAddDdayModal() { document.getElementById('dday-modal').classList.add('hidden'); }

function saveNewDday() {
  const title = document.getElementById('dday-title-input').value;
  if(!title) return alert('D-Day 목표명을 입력하세요.');
  ddayList.push({ id: Date.now(), title: title, days: 'D-30', color: 'indigo' });
  renderDdays();
  closeAddDdayModal();
  document.getElementById('dday-title-input').value = '';
}

function openHomeCustomizeModal() { document.getElementById('customize-modal').classList.remove('hidden'); }
function closeHomeCustomizeModal() { document.getElementById('customize-modal').classList.add('hidden'); }

function toggleWidget(widgetId) {
  const el = document.getElementById(widgetId);
  if(el) el.classList.toggle('hidden');
}

function switchTab(tabId) {
  ['home', 'list', 'plan', 'community', 'mypage'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.add('hidden');
    document.getElementById(`nav-${t}`).className = "flex flex-col items-center justify-center flex-1 text-slate-400";
  });
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.getElementById(`nav-${tabId}`).className = "flex flex-col items-center justify-center flex-1 text-indigo-600 font-bold";

  if(tabId === 'plan') {
    document.getElementById('plan-form').reset();
  }
}

function switchCategoryTab(type) {
  ['all', 'cert', 'nstudy', 'univ', 'high'].forEach(t => {
    const btn = document.getElementById(`cat-tab-${t}`);
    if(btn) btn.className = "px-3 py-1 rounded-full text-slate-500 hover:bg-slate-100 shrink-0";
  });
  document.getElementById(`cat-tab-${type}`).className = "px-3 py-1 rounded-full bg-indigo-600 text-white shrink-0";
  renderHashtags(type);
}

function renderHashtags(type) {
  const container = document.getElementById('hashtag-container');
  container.innerHTML = (categoryHashtags[type] || categoryHashtags['all']).map(tag => 
    `<span class="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium">${tag}</span>`
  ).join('');
}

function savePlan() {
  alert('학습계획이 성공적으로 저장되었습니다!');
  switchTab('home');
}

function openAiModal() { document.getElementById('ai-modal').classList.remove('hidden'); }
function closeAiModal() { document.getElementById('ai-modal').classList.add('hidden'); }

function openSubPage(title) {
  document.getElementById('subpage-title').innerText = title;
  document.getElementById('subpage-content').innerHTML = `<p class="font-bold text-slate-800 mb-2">[${title}] 상세 내용</p><p>수정 및 관리 기능이 정상 동작합니다.</p>`;
  document.getElementById('subpage-modal').classList.remove('hidden');
}

function closeSubPage() { document.getElementById('subpage-modal').classList.add('hidden'); }
function updateFileName(input) { if(input.files[0]) document.getElementById('file-name').innerText = input.files[0].name; }
