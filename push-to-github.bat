@echo off
chcp 65001 >nul
echo ==========================================
echo 推送到 GitHub
echo ==========================================
echo.

cd /d "C:\Users\leesu\.qclaw\workspace\red-alert-mobile"

echo 正在推送到 GitHub...
echo.
echo 请按提示输入你的 GitHub 用户名和密码/Personal Access Token
echo.
echo 注意：密码栏输入时不会显示任何字符，这是正常的
echo.

git push -u origin main

echo.
echo ==========================================
echo 推送完成！
echo ==========================================
echo.
echo 如果推送成功，请访问：
echo   https://github.com/leesurels/red-alert-mobile
echo.
echo GitHub Actions 将自动开始构建 APK
echo 构建完成后，访问 Releases 页面下载：
echo   https://github.com/leesurels/red-alert-mobile/releases
echo.

pause
