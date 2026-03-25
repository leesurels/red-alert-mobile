#!/bin/bash

# 红色警戒 APK 构建脚本
# 此脚本使用 Gradle Wrapper 构建 APK

echo "=========================================="
echo "红色警戒：共和国之辉 - APK 构建脚本"
echo "=========================================="
echo ""

# 检查 Java
echo "检查 Java 环境..."
if ! command -v java &> /dev/null; then
    echo "错误：未找到 Java JDK"
    echo "请安装 Java JDK 8 或更高版本"
    echo "下载地址：https://adoptium.net/"
    exit 1
fi

java -version
echo ""

# 检查 Android SDK
echo "检查 Android SDK..."
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "警告：未设置 ANDROID_HOME 环境变量"
    echo "尝试查找 Android SDK..."
    
    # 常见安装路径
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "$HOME/AppData/Local/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
    elif [ -d "/usr/lib/android-sdk" ]; then
        export ANDROID_HOME="/usr/lib/android-sdk"
    fi
fi

if [ -n "$ANDROID_HOME" ]; then
    echo "Android SDK 位置: $ANDROID_HOME"
    export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
else
    echo "错误：未找到 Android SDK"
    echo "请安装 Android Studio 或 Android SDK Command Line Tools"
    exit 1
fi

echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 检查项目结构
if [ ! -f "capacitor.config.json" ]; then
    echo "错误：未找到 capacitor.config.json"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

echo "同步项目..."
npx cap sync android

echo ""
echo "构建 APK..."
cd android

# 构建调试 APK
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "构建成功！"
    echo "=========================================="
    echo ""
    echo "APK 文件位置："
    echo "  app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "安装到设备："
    echo "  adb install -r app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    
    # 复制 APK 到项目根目录
    cp app/build/outputs/apk/debug/app-debug.apk ../红色警戒-共和国之辉.apk
    echo "APK 已复制到: 红色警戒-共和国之辉.apk"
else
    echo ""
    echo "构建失败，请检查错误信息"
    exit 1
fi
