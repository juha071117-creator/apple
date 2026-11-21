/**
 * Study Mate Google Apps Script API
 * 회원가입, 탐색(학습계획/AI 문제지), 커뮤니티 게시글 데이터를 관리합니다.
 * 대상 스프레드시트 ID는 기존 프로젝트 설정을 유지합니다.
 */
const SPREADSHEET_ID = '1CBpNWbigFoBdbarBHIeh8GxSOuT--u5CEzbK-F92x44';
const SHEET_HEADERS = {
  join: ['가입일시', '아이디', '학교명', '학교구분'],
  explore_plans: ['계획ID', '사용자ID', '학교구분', '학교명', '과목명', '시험명', '학습기간', '학습내용', '진도율', '즐겨찾기', '첨부파일', '참고URL', '원본데이터', '수정일시'],
  explore_ai_quizzes: ['문제지ID', '사용자ID', '문제지제목', '키워드', '생성일', '즐겨찾기', '요약', '문제내용', '선택지', '정답번호', '해설', '원본데이터', '수정일시'],
  posts: ['ID', '작성일시', '학교구분', '학교명', '과목명', '시험명', '해시태그', '내용', '작성자', '좋아요'],
  comments: ['댓글ID', '게시글ID', '작성일시', '작성자ID', '익명여부', '댓글내용'],
  likes: ['좋아요ID', '게시글ID', '사용자ID', '공감일시']
};

/** 최초 1회 실행하면 회원/탐색/커뮤니티 시트를 모두 준비합니다. */
function setupStudyMateSheets() {
  Object.keys(SHEET_HEADERS).forEach(name => getSheet_(name));
  return 'Study Mate 시트 6개 준비 완료';
}

function doGet() {
  try {
    return jsonOutput({
      status: 'success',
      message: 'Study Mate API is running',
      users: readRows_('join'),
      plans: readRows_('explore_plans').map(r => parseStored_(r)),
      aiQuizzes: readRows_('explore_ai_quizzes').map(r => parseStored_(r)),
      posts: readRows_('posts')
    });
  } catch (err) {
    return jsonOutput({ status: 'error', message: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!e || !e.postData || !e.postData.contents) throw new Error('요청 데이터가 비어 있습니다.');
    const p = JSON.parse(e.postData.contents);
    switch (p.action) {
      case 'signup': return saveSignup_(p);
      case 'savePlan': return savePlan_(p);
      case 'updatePlanProgress': return updatePlanProgress_(p);
      case 'togglePlanFavorite': return updateFavorite_('explore_plans', p);
      case 'saveQuiz': return saveQuiz_(p);
      case 'toggleQuizFavorite': return updateFavorite_('explore_ai_quizzes', p);
      case 'post': return savePost_(p);
      case 'comment': return saveComment_(p);
      case 'like': return saveLike_(p);
      default: throw new Error('지원하지 않는 action입니다: ' + p.action);
    }
  } catch (err) {
    return jsonOutput({ status: 'error', message: err.message });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function getSheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const headers = SHEET_HEADERS[name];
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#fce7f3').setWrap(true);
  }
  return sh;
}

function readRows_(name) {
  const sh = getSheet_(name);
  if (sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values.shift();
  return values.filter(row => row.some(v => v !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] instanceof Date ? Utilities.formatDate(row[i], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : row[i]);
    return obj;
  });
}

function parseStored_(row) {
  if (row['원본데이터']) {
    try { return JSON.parse(row['원본데이터']); } catch (e) {}
  }
  return row;
}

function upsertById_(sheetName, idHeader, id, values) {
  const sh = getSheet_(sheetName);
  const headers = SHEET_HEADERS[sheetName];
  const idCol = headers.indexOf(idHeader) + 1;
  const last = sh.getLastRow();
  if (last >= 2) {
    const ids = sh.getRange(2, idCol, last - 1, 1).getDisplayValues().flat();
    const index = ids.findIndex(v => String(v) === String(id));
    if (index >= 0) {
      sh.getRange(index + 2, 1, 1, values.length).setValues([values]);
      return index + 2;
    }
  }
  sh.appendRow(values);
  return sh.getLastRow();
}

function saveSignup_(p) {
  const userId = String(p.userId || '').trim();
  if (!userId) throw new Error('아이디가 없습니다.');
  const sh = getSheet_('join');
  const ids = sh.getLastRow() >= 2 ? sh.getRange(2, 2, sh.getLastRow() - 1, 1).getDisplayValues().flat() : [];
  if (ids.includes(userId)) return jsonOutput({ status: 'error', message: '이미 등록된 아이디입니다.' });
  sh.appendRow([new Date(), userId, String(p.schoolName || '소속 미입력'), String(p.schoolType || '')]);
  return jsonOutput({ status: 'success', message: '회원가입 정보 저장 완료' });
}

function savePlan_(p) {
  const x = p.plan || p;
  const id = String(x.id || p.id || Utilities.getUuid());
  const userId = String(p.userId || x.userId || '');
  const period = x.period || [x.startDate || '', x.examDate || ''].filter(Boolean).join(' ~ ');
  const values = [id, userId, x.category || '', x.school || x.organization || '', x.subject || '', x.exam || '', period, x.content || x.curriculum || '', Number(x.progress || 0), Boolean(x.favorite), x.attachment || '', x.url || '', JSON.stringify(x), new Date()];
  const row = upsertById_('explore_plans', '계획ID', id, values);
  return jsonOutput({ status: 'success', message: '학습계획 저장 완료', id, row });
}

function updatePlanProgress_(p) {
  const rows = readRows_('explore_plans');
  const row = rows.find(r => String(r['계획ID']) === String(p.id));
  if (!row) throw new Error('해당 학습계획을 찾을 수 없습니다.');
  let obj = parseStored_(row); obj.progress = Number(p.progress || 0);
  return savePlan_({ userId: p.userId, plan: obj });
}

function saveQuiz_(p) {
  const q = p.quiz || p;
  const id = String(q.id || Utilities.getUuid());
  const values = [id, String(p.userId || q.userId || ''), q.title || '', q.keyword || '', q.date || new Date(), Boolean(q.favorite), q.summary || '', q.question || '', JSON.stringify(q.choices || []), Number(q.answerIndex || 0), q.explanation || '', JSON.stringify(q), new Date()];
  const row = upsertById_('explore_ai_quizzes', '문제지ID', id, values);
  return jsonOutput({ status: 'success', message: 'AI 문제지 저장 완료', id, row });
}

function updateFavorite_(sheetName, p) {
  const headers = SHEET_HEADERS[sheetName];
  const idHeader = headers[0];
  const rows = readRows_(sheetName);
  const row = rows.find(r => String(r[idHeader]) === String(p.id));
  if (!row) throw new Error('즐겨찾기 대상을 찾을 수 없습니다.');
  const obj = parseStored_(row); obj.favorite = Boolean(p.favorite);
  return sheetName === 'explore_plans' ? savePlan_({ userId: p.userId, plan: obj }) : saveQuiz_({ userId: p.userId, quiz: obj });
}

function savePost_(p) {
  const id = String(p.id || Date.now());
  const sh = getSheet_('posts');
  const row = upsertById_('posts', 'ID', id, [id, new Date(), p.schoolType || '', p.schoolName || '', p.subject || '', p.exam || '', (p.tags || []).join(','), p.content || '', p.author || '', 0]);
  return jsonOutput({ status: 'success', message: '게시글 저장 완료', row });
}

function saveComment_(p) {
  const sh = getSheet_('comments');
  const id = String(p.id || Date.now());
  sh.appendRow([id, String(p.postId || ''), new Date(), String(p.userId || ''), Boolean(p.anonymous), String(p.text || '')]);
  return jsonOutput({ status: 'success', message: '댓글 저장 완료' });
}

function saveLike_(p) {
  const sh = getSheet_('likes');
  const id = String(p.userId || '') + '_' + String(p.postId || '');
  const ids = sh.getLastRow() >= 2 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().flat() : [];
  if (ids.includes(id)) return jsonOutput({ status: 'success', message: '이미 공감한 게시글입니다.' });
  sh.appendRow([id, String(p.postId || ''), String(p.userId || ''), new Date()]);
  return jsonOutput({ status: 'success', message: '공감 저장 완료' });
}

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
