#!/bin/bash
# ───────────────────────────────────────────────
#  World Cup 2026 アプリ  起動 (macOS)
#  このファイルをダブルクリックするだけで起動します。
#  停止するには、開いたウィンドウで Control + C を押してください。
# ───────────────────────────────────────────────
cd "$(dirname "$0")" || exit 1
PORT=8000

if command -v python3 >/dev/null 2>&1; then PY=python3
elif command -v python  >/dev/null 2>&1; then PY=python
else
  echo "⚠ Python が見つかりません。https://www.python.org からインストールしてください。"
  echo "（Enter キーで閉じます）"; read -r; exit 1
fi

echo "⚽ World Cup 2026 を起動します → http://localhost:$PORT"
echo "   （停止: Control + C ／ このウィンドウを閉じてもOK）"
echo

# サーバー起動の1秒後にブラウザを自動で開く
( sleep 1; open "http://localhost:$PORT" ) &

$PY -m http.server "$PORT"
