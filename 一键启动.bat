@echo off
cd /d "C:\Users\王佳雯\Desktop\情绪树洞"
echo 🌳 情绪树洞 - 启动中...
start /B node server.js
timeout /t 3 /nobreak >nul
:npx
npx localtunnel --port 3457 2>&1
echo ⚠️ 隧道断了，5秒后重连...
timeout /t 5 /nobreak >nul
goto npx
