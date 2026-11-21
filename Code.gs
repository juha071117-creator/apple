/**
 * Study Mate - Google Apps Script
 * 회원가입 정보를 Google 스프레드시트의 join 탭에 저장합니다.
 * 대상 스프레드시트 ID: 1CBpNWbigFoBdbarBHIeh8GxSOuT--u5CEzbK-F92x44
 * 보안상 비밀번호 원문은 시트에 저장하지 않습니다.
 */

const SPREADSHEET_ID = '1CBpNWbigFoBdbarBHIeh8GxSOuT--u5CEzbK-F92x44';
const SHEET_NAME = 'join';
const HEADERS = ['가입일시', '아이디', '학교명', '학교구분'];

/** 최초 1회 실행: join 탭을 만들고 1행에 제목을 입력합니다. */
function setupJoinSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (firstRow.every(value => value === '')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#fce7f3')
      .setWrap(true);
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return 'join 탭 준비 완료';
}

/** 웹 앱 연결 확인 */
function doGet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  let users = [];
  if (sheet && sheet.getLastRow() >= 2) {
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
    users = values.map(row => ({
      '가입일시': row[0] instanceof Date ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : row[0],
      '아이디': String(row[1] || ''),
      '학교명': String(row[2] || ''),
      '학교구분': String(row[3] || '')
    }));
  }
  return jsonOutput({ status: 'success', message: 'Study Mate join API is running', sheet: SHEET_NAME, users });
}

/** 회원가입 정보 저장: action=signup */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('요청 데이터가 비어 있습니다.');
    }

    const payload = JSON.parse(e.postData.contents);
    if (payload.action !== 'signup') {
      throw new Error('현재 지원하는 작업은 회원가입(signup) 저장입니다.');
    }

    const userId = String(payload.userId || '').trim();
    if (!userId) throw new Error('아이디가 없습니다.');

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }

    // 같은 아이디가 이미 있으면 중복 행을 추가하지 않습니다.
    if (sheet.getLastRow() >= 2) {
      const ids = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
      if (ids.includes(userId)) {
        return jsonOutput({ status: 'error', message: '이미 등록된 아이디입니다.' });
      }
    }

    sheet.appendRow([
      new Date(),
      userId,
      String(payload.schoolName || '소속 미입력'),
      String(payload.schoolType || '')
    ]);
    const rowNumber = sheet.getLastRow();
    sheet.getRange(rowNumber, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.autoResizeColumns(1, HEADERS.length);

    return jsonOutput({ status: 'success', message: '회원가입 정보가 저장되었습니다.', row: rowNumber });
  } catch (error) {
    return jsonOutput({ status: 'error', message: error.message });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
