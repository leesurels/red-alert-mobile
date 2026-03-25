@echo off
chcp 65001 >nul
echo ========================================
echo 红色警戒：共和国之辉 - 移动版构建脚本
echo ========================================
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到 Node.js，请先安装 Node.js
    exit /b 1
)

REM 检查 Cordova
cordova --version >nul 2>&1
if errorlevel 1 (
    echo 正在安装 Cordova...
    npm install -g cordova
)

REM 安装依赖
echo.
echo 正在安装依赖...
call npm install

REM 添加 Android 平台（如果不存在）
if not exist "platforms\android" (
    echo.
    echo 正在添加 Android 平台...
    call cordova platform add android
)

REM 构建 APK
echo.
echo 正在构建 APK...
call cordova build android

REM 检查构建结果
if exist "platforms\android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ========================================
    echo 构建成功！
    echo ========================================
    echo.
    echo APK 文件位置：
    echo   platforms\android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo 安装到设备：
    echo   adb install -r platforms\android\app\build\outputs\apk\debug\app-debug.apk
    echo.
) else (
    echo.
    echo 构建失败，请检查错误信息
    exit /b 1
)

pause
