// ニンテンドーミュージアム 7月チケット販売開始通知スクリプト
//
// 【使い方】
// 1. https://script.google.com を genereoyuna@gmail.com で開く
// 2. 「新しいプロジェクト」→ このコードを全部貼り付けて保存
// 3. 「setupTrigger」を選択して▶実行（初回のみ・権限許可が必要）
// 4. あとは自動で1時間ごとに監視して、販売開始したらメールが届く

const NOTIFY_TO = 'generationsreo@icloud.com';
const CALENDAR_API = 'https://museum-tickets.nintendo.com/api/calendar?target_year=2026&target_month=7';
const PREV_STATE_KEY = 'july_2026_prev_open'; // 前回チェック時に空きがあったか

function checkAndNotify() {
  const props = PropertiesService.getScriptProperties();

  try {
    // セッション・XSRFトークン取得
    const sessionRes = UrlFetchApp.fetch('https://museum-tickets.nintendo.com/calendar', {
      muteHttpExceptions: true
    });

    let xsrfToken = '';
    let cookieHeader = '';
    const rawCookies = sessionRes.getAllHeaders()['Set-Cookie'] || [];
    const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];

    for (const c of cookies) {
      const xsrf = c.match(/XSRF-TOKEN=([^;]+)/);
      if (xsrf) {
        xsrfToken = decodeURIComponent(xsrf[1]);
        cookieHeader += `XSRF-TOKEN=${xsrf[1]}; `;
      }
      const sess = c.match(/history_session=([^;]+)/);
      if (sess) cookieHeader += `history_session=${sess[1]}; `;
    }

    // 7月カレンダーAPIを取得
    const res = UrlFetchApp.fetch(CALENDAR_API, {
      muteHttpExceptions: true,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://museum-tickets.nintendo.com/calendar',
        'x-xsrf-token': xsrfToken,
        'Cookie': cookieHeader.trim()
      }
    });

    const json = JSON.parse(res.getContentText());
    const calendar = json.data.calendar;

    // apply_type が null でない日が1日でもあれば空きあり
    const isOpen = Object.values(calendar).some(d => d.apply_type !== null);
    const wasOpen = props.getProperty(PREV_STATE_KEY) === 'true';

    // 前回「空きなし」→ 今回「空きあり」に変わったときだけ通知
    if (isOpen && !wasOpen) {
      GmailApp.sendEmail(
        NOTIFY_TO,
        '【ニンテンドーミュージアム】7月チケットに空きが出ました！',
        '7月分のチケットに空きが出ました。お早めにどうぞ。\n\n予約ページ：\nhttps://museum-tickets.nintendo.com/calendar',
        {
          htmlBody: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
  <h2 style="color:#e60012;">ニンテンドーミュージアム<br>7月チケットに空きが出ました！</h2>
  <p>7月分のチケットに空きが出ました。お早めにどうぞ。</p>
  <p>
    <a href="https://museum-tickets.nintendo.com/calendar"
       style="display:inline-block;background:#e60012;color:#fff;
              padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;">
      今すぐ予約する
    </a>
  </p>
</div>`
        }
      );
      console.log('通知メール送信完了');
    } else if (!isOpen) {
      console.log('7月分：空きなし');
    } else {
      console.log('7月分：空きあり（前回も空きありのため通知スキップ）');
    }

    // 状態を保存（次回チェックのために）
    props.setProperty(PREV_STATE_KEY, isOpen ? 'true' : 'false');

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
    '【テスト】ニンテンドーミュージアム通知スクリプト動作確認',
    'このメールが届けばスクリプトは正常に動作しています。'
  );
  console.log('テストメール送信完了');
}
