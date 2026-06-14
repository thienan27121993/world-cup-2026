#!/bin/bash
# ───────────────────────────────────────────────
#  World Cup 2026 アプリ  起動 (Linux)
#  実行: ターミナルで  ./起動_Linux.sh   または ファイルマネージャからダブルクリック
#  停止: Ctrl + C
# ───────────────────────────────────────────────
cd "$(dirname "$0")" || exit 1
PORT=8000

if command -v python3 >/dev/null 2>&1; then PY=python3
elif command -v python  >/dev/null 2>&1; then PY=python
else
  echo "⚠ Python が見つかりません。 sudo apt install python3 などでインストールしてください。"
  read -r; exit 1
fi

echo "⚽ World Cup 2026 を起動します → http://localhost:$PORT  （停止: Ctrl + C）"
( sleep 1; (xdg-open "http://localhost:$PORT" >/dev/null 2>&1 || true) ) &

$PY -m http.server "$PORT"
