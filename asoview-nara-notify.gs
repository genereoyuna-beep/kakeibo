// 奈良監獄ミュージアム 中央看守所見学 5月分 空き通知スクリプト
//
// 【使い方】
// 1. https://script.google.com を genereoyuna@gmail.com で開く
// 2. 「新しいプロジェクト」→ このコードを全部貼り付けて保存
// 3. 「setupTrigger」を選択して▶実行（初回のみ・権限許可が必要）
// 4. あとは自動で5分ごとに監視して、空きが出たらメールが届く

const NOTIFY_TO   = 'generationsreo@icloud.com';
const COURSE_ID   = 30859;
const YEAR_MONTH  = '2026-05';  // 監視対象月
const PREV_KEY    = 'asoview_nara_may2026_open';

const API_URL = `https://nara-prison-museum.urkt.in/api/direct/courses/${COURSE_ID}/calendars`
              + `?start_date=${YEAR_MONTH}-01&end_date=${YEAR_MONTH}-31&language_type=ja`;

const BOOKING_URL = 'https://www.asoview.com/channel/activities/ja/nara-prison-museum/offices/7924/courses/30859/calendars';

function checkAndNotify() {
  const props = PropertiesService.getScriptProperties();

  try {
    const res = UrlFetchApp.fetch(API_URL, {
      muteHttpExceptions: true,
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://www.asoview.com',
        'Referer': 'https://www.asoview.com/'
      }
    });

    if (res.getResponseCode() !== 200) {
      console.error('API Error:', res.getResponseCode(), res.getContentText());
      return;
    }

    const days = JSON.parse(res.getContentText());

    // status が "open"（空きあり）または "tel"（リクエスト予約）の日を抽出
    const availableDays = days.filter(d => d.status === 'open' || d.status === 'tel');
    const isOpen = availableDays.length > 0;
    const wasOpen = props.getProperty(PREV_KEY) === 'true';

    if (isOpen && !wasOpen) {
      // 空きが出た → メール通知
      const dayList = availableDays.map(d => {
        const label = d.status === 'tel' ? '（リクエスト予約）' : '';
        return `・${d.date}${label}`;
      }).join('\n');

      const subject = '【奈良監獄ミュージアム】5月分に空きが出ました！';
      const plainBody = `5月分の中央看守所見学に空きが出ました。お早めにどうぞ。\n\n空き日程：\n${dayList}\n\n予約ページ：\n${BOOKING_URL}`;
      const htmlBody = `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
  <h2 style="color:#2c5282;">奈良監獄ミュージアム<br>5月分に空きが出ました！</h2>
  <p>中央看守所見学（5月分）に空きが出ました。お早めにどうぞ。</p>
  <h3 style="margin-bottom:4px;">空き日程</h3>
  <ul style="padding-left:20px;">
    ${availableDays.map(d => {
      const label = d.status === 'tel' ? ' <span style="color:#718096;font-size:0.9em;">（リクエスト予約）</span>' : '';
      return `<li>${d.date}${label}</li>`;
    }).join('')}
  </ul>
  <p style="margin-top:24px;">
    <a href="${BOOKING_URL}"
       style="display:inline-block;background:#2c5282;color:#fff;
              padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;">
      今すぐ予約する
    </a>
  </p>
  <p style="color:#718096;font-size:0.85em;margin-top:24px;">
    このメールは自動監視スクリプトから送信されています。
  </p>
</div>`;

      GmailApp.sendEmail(NOTIFY_TO, subject, plainBody, { htmlBody });
      console.log('通知メール送信完了。空き日程:', dayList);

    } else if (!isOpen) {
      console.log('5月分：空きなし');
    } else {
      console.log('5月分：空きあり（前回も空きありのため通知スキップ）');
    }

    props.setProperty(PREV_KEY, isOpen ? 'true' : 'false');

  } catch (e) {
    console.error('エラー:', e.message);
  }
}

// 【初回のみ実行】5分ごとのトリガーをセットアップ
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkAndNotify')
    .timeBased()
    .everyMinutes(5)
    .create();
  console.log('トリガーをセットしました（5分ごとに checkAndNotify が動きます）');
}

// テスト用：メールが届くか確認したいときに実行
function testSendMail() {
  GmailApp.sendEmail(
    NOTIFY_TO,
    '【テスト】奈良監獄ミュージアム通知スクリプト動作確認',
    'このメールが届けばスクリプトは正常に動作しています。\n\n監視URL: ' + BOOKING_URL
  );
  console.log('テストメール送信完了');
}
