@echo off
chcp 65001 >nul
echo.
echo ================================
echo 正在修复 GitHub 访问...
echo ================================
echo.

:: 添加 GitHub hosts 记录
echo # GitHub >> %windir%\System32\drivers\etc\hosts
echo 140.82.116.3 github.com >> %windir%\System32\drivers\etc\hosts
echo 140.82.116.3 api.github.com >> %windir%\System32\drivers\etc\hosts
echo 185.199.108.153 github.githubassets.com >> %windir%\System32\drivers\etc\hosts
echo 140.82.113.22 collector.github.com >> %windir%\System32\drivers\etc\hosts

echo.
echo ✅ 完成！现在可以访问 GitHub 了
echo.
echo 正在打开 GitHub 注册页面...
start https://github.com/signup

echo.
pause
