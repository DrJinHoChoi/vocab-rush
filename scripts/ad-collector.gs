/**
 * STUDY RUSH — 키오스크 광고 노출 수집기 (Google Apps Script)
 *
 * 직접 판매 광고의 노출/클릭을 Google 스프레드시트에 모아 광고주 리포트로 씁니다.
 * datapd.ai 는 정적 사이트(백엔드 없음)라, 무료 Apps Script 로 수집 서버를 대체합니다.
 *
 * ── 설치 (약 5분) ────────────────────────────────────────────
 * 1) https://sheets.new 로 새 구글 시트 생성.
 * 2) 확장 프로그램 → Apps Script → 이 파일 내용 전체를 붙여넣고 저장.
 * 3) 배포 → 새 배포 → 유형: "웹 앱"
 *      - 실행: 나(본인)
 *      - 액세스 권한: 모든 사용자
 * 4) 배포 후 표시되는 "웹 앱 URL" 을 복사.
 * 5) public/ads/kiosk-ads.json 의 "reportEndpoint" 값에 그 URL 을 붙여넣고 커밋.
 *      → 이후 모든 키오스크의 노출/클릭이 이 시트(adlog 탭)에 자동 기록됩니다.
 *
 * 리포트: 시트에서 삽입 → 피벗 테이블로 광고주별 · 일자별 · 슬롯별 집계.
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('adlog') || ss.insertSheet('adlog');
    if (sh.getLastRow() === 0) {
      sh.appendRow(['시각', '이벤트', '슬롯', '광고ID', '광고주', '페이지', '키오스크']);
    }
    var d = JSON.parse(e.postData.contents);
    var slotKo = { bottom: '하단 띠배너', result: '결과 카드', interstitial: '전면 광고' }[d.slot] || d.slot || '';
    sh.appendRow([
      new Date(d.t || Date.now()),
      d.ev === 'click' ? '클릭' : '노출',
      slotKo,
      d.ad || '',
      d.adv || '(미상)',
      d.page || '',
      d.kiosk ? 'Y' : 'N'
    ]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('err: ' + err);
  }
}

function doGet() {
  return ContentService.createTextOutput('STUDY RUSH ad collector — OK');
}
