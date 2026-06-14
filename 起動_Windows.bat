@echo off
chcp 65001 >nul
rem ───────────────────────────────────────────────
rem  World Cup 2026 アプリ  起動 (Windows)
rem  このファイルをダブルクリックするだけで起動します。
rem  停止するには、このウィンドウで Ctrl + C か、ウィンドウを閉じてください。
rem ───────────────────────────────────────────────
cd /d "%~dp0"
set PORT=8000

set PY=
where python >nul 2>nul && set PY=python
if "%PY%"=="" ( where py >nul 2>nul && set PY=py )
if "%PY%"=="" (
  echo.
  echo  [!] Python が見つかりません。https://www.python.org からインストールしてください。
  echo      インストール時に「Add Python to PATH」に必ずチェックを入れてください。
  echo.
  pause
  exit /b 1
)

echo.
echo  World Cup 2026 を起動します -^> http://localhost:%PORT%
echo  （停止: Ctrl + C ／ このウィンドウを閉じてもOK）
echo.

start "" "http://localhost:%PORT%"
%PY% -m http.server %PORT%
