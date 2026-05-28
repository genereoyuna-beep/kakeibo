/**
 * LicenseHub メール送信スクリプト
 * Google Apps Script (GAS) にコピーしてウェブアプリとしてデプロイしてください。
 *
 * デプロイ手順：
 * 1. https://script.google.com にアクセスし「新しいプロジェクト」を作成
 * 2. このコードを貼り付けて保存
 * 3. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
 * 4. 「次のユーザーとして実行」→ 自分（Gmailアカウント）
 *    「アクセスできるユーザー」→ 全員
 * 5. 「デプロイ」ボタンを押し、表示された「ウェブアプリのURL」をコピー
 * 6. license-management.html の「GAS設定」欄にそのURLを貼り付ける
 */

// CORS対応：OPTIONSリクエストへの応答
function doOptions(e) {
  return buildCorsResponse('');
}

// POSTリクエスト受信 → メール送信
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const to      = data.to      || '';
    const subject = data.subject || '（件名なし）';
    const body    = data.body    || '';
    const htmlBody = data.htmlBody || body;

    if (!to) throw new Error('送信先メールアドレスが指定されていません');

    // 複数アドレス対応（カンマ区切り）
    const recipients = to.split(',').map(s => s.trim()).filter(Boolean).join(',');

    MailApp.sendEmail({
      to: recipients,
      subject: subject,
      body: body,
      htmlBody: htmlBody,
    });

    return buildCorsResponse(JSON.stringify({ success: true, message: 'メールを送信しました' }));

  } catch (err) {
    return buildCorsResponse(JSON.stringify({ success: false, error: err.message }));
  }
}

// GETリクエスト：疎通確認用
function doGet(e) {
  return buildCorsResponse(JSON.stringify({ status: 'ok', message: 'LicenseHub Mailer is running' }));
}

// CORS ヘッダー付きレスポンスを生成
function buildCorsResponse(body) {
  const output = ContentService.createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
