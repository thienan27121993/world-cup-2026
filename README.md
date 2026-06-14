# World Cup 2026 アプリ — セットアップ手順

落ち着いた配色のPWA。次の試合の自動繰り上げ、予約通知、順位表の自動計算、中継リンク、ライブスコア連携に対応しています。

## ファイル構成
- `index.html` … アプリ本体
- `sw.js` … Service Worker（オフライン／予約通知／本物のプッシュ受け口）
- `manifest.webmanifest` … ホーム画面インストール用
- `icon.svg` … アイコン

---

## 1. すぐ試す（ローカル）
`file://` で直接開くと Service Worker が動かず、予約通知とインストールが無効になります。簡易サーバーで開いてください。

```bash
cd このフォルダ
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

「通知・設定」→「デモ表示」をONにすると、開幕前でも順位表・ライブ表示・LIVEバッジを確認できます。

## 2. スマホで使う（HTTPS公開が必要）
インストールとプッシュ通知は **HTTPSのURL** から開いた場合のみ有効です。無料で公開できます。

- **Netlify Drop**: https://app.netlify.com/drop にこのフォルダをドラッグするだけ
- **Cloudflare Pages / GitHub Pages / Vercel** でも可

公開URLをスマホで開き、設定タブの手順でホーム画面に追加します。

---

## 3. 通知の3段階（重要）

| 方式 | 閉じても届く？ | 必要なもの |
|---|---|---|
| アプリ起動中タイマー | × | なし（どの端末でも動作） |
| **予約通知 (Notification Triggers)** | ◯ | HTTPS + 対応ブラウザ（Chrome/Edge等） |
| **本物のWeb Push** | ◎（端末オフでもサーバーから） | HTTPS + 配信サーバー + VAPID鍵 |

アプリは対応環境を自動判定し、可能な限り上位の方式を使います。`sw.js` には Web Push の受け口（`push`イベント）を実装済みなので、下記サーバーを追加すれば本物のプッシュになります。

### 本物のWeb Pushを足す場合（概要）
1. VAPID鍵を生成: `npx web-push generate-vapid-keys`
2. `index.html` で購読を取得して自前サーバーに保存:
   ```js
   const sub = await swReg.pushManager.subscribe({
     userVisibleOnly:true,
     applicationServerKey: '<VAPID公開鍵>'
   });
   await fetch('/save-subscription',{method:'POST',body:JSON.stringify(sub)});
   ```
3. 各試合のキックオフ前に、サーバーから `web-push` で送信（`sw.js` の `push` が受信して表示）。

---

## 4. ライブスコア・順位のリアルタイム連携

ブラウザから直接スポーツAPI（API-Football, football-data.org 等）を呼ぶと、CORS制限とAPIキー漏洩の問題があります。**自分のプロキシ経由**にするのが正しい構成です。

アプリは設定タブの「プロキシURL」に対し `GET {URL}/live` を叩き、次の形を期待します（試合IDはアプリ内のID）:

```json
{
  "updated": "2026-06-15T05:30:00+09:00",
  "results": {
    "9":  { "sh": 1, "sa": 1, "status": "LIVE", "minute": 67 },
    "1":  { "sh": 2, "sa": 1, "status": "FT" }
  }
}
```
`status` は `NS`(未開始) / `LIVE`(進行中) / `FT`(終了)。順位表はこの結果からアプリ側が自動計算します。

### Cloudflare Worker プロキシ実装例（football-data.org をラップ）
APIキーはWorker側の環境変数に置き、外部APIのIDをアプリのIDへ変換します。

```js
// wrangler secret put FD_KEY で APIキーを登録
const ID_MAP = { /* 例: footballDataのmatchId : アプリのID */ 537001: 9, 537002: 1 };

export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' };
    if (new URL(req.url).pathname !== '/live')
      return new Response('ok', { headers: cors });

    // 大会ID 2000 = FIFA World Cup
    const r = await fetch('https://api.football-data.org/v4/competitions/2000/matches', {
      headers: { 'X-Auth-Token': env.FD_KEY }
    });
    const data = await r.json();
    const results = {};
    for (const mt of data.matches || []) {
      const id = ID_MAP[mt.id]; if (!id) continue;
      const st = mt.status === 'FINISHED' ? 'FT'
               : (mt.status === 'IN_PLAY' || mt.status === 'PAUSED') ? 'LIVE' : 'NS';
      results[id] = {
        sh: mt.score?.fullTime?.home ?? null,
        sa: mt.score?.fullTime?.away ?? null,
        status: st,
        minute: mt.minute ?? null
      };
    }
    return new Response(JSON.stringify({ updated: new Date().toISOString(), results }), { headers: cors });
  }
}
```

公開したWorkerのURLを設定タブに入力すれば、結果・LIVEスコア・順位表が自動更新されます。

---

## データの注意
試合日程は2026年6月8日時点の確定情報（日本時間）です。第2・3節の一部時刻と決勝トーナメントの組み合わせは大会進行に伴い確定します。上記ライブ連携を設定すると、結果・順位は自動で反映されます。
