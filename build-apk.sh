#!/bin/bash

# 红色警戒移动版构建脚本

echo "========================================"
echo "红色警戒：共和国之辉 - 移动版构建脚本"
echo "========================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误：未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 Cordova
if ! command -v cordova &> /dev/null; then
    echo "正在安装 Cordova..."
    npm install -g cordova
fi

# 安装依赖
echo ""
echo "正在安装依赖..."
npm install

# 添加 Android 平台（如果不存在）
if [ ! -d "platforms/android" ]; then
    echo ""
    echo "正在添加 Android 平台..."
    cordova platform add android
fi

# 构建 APK
echo ""
echo "正在构建 APK..."
cordova build android

# 检查构建结果
if [ -f "platforms/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "========================================"
    echo "构建成功！"
    echo "========================================"
    echo ""
    echo "APK 文件位置："
    echo "  platforms/android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "安装到设备："
    echo "  adb install -r platforms/android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
else
    echo ""
    echo "构建失败，请检查错误信息"
    exit 1
fi
