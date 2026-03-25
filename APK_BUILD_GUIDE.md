# APK 构建指南

## 方法一：使用 Capacitor 构建（推荐）

### 前提条件
1. 安装 Node.js (https://nodejs.org/)
2. 安装 Java JDK 8 或更高版本 (https://adoptium.net/)
3. 安装 Android Studio 或 Android SDK Command Line Tools

### 步骤

#### 1. 安装依赖
```bash
cd red-alert-mobile
npm install
```

#### 2. 添加 Android 平台
```bash
npx cap add android
```

#### 3. 同步项目
```bash
npx cap sync android
```

#### 4. 构建 APK
```bash
cd android
./gradlew assembleDebug
```

APK 将生成在：`android/app/build/outputs/apk/debug/app-debug.apk`

#### 5. 安装到手机
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 方法二：使用 Android Studio 构建

### 步骤

1. 执行方法一的前3步
2. 打开 Android Studio
3. 选择 "Open an existing project"
4. 选择 `red-alert-mobile/android` 文件夹
5. 等待 Gradle 同步完成
6. 点击菜单 Build → Build Bundle(s) / APK(s) → Build APK(s)
7. APK 将生成在 `android/app/build/outputs/apk/debug/`

---

## 方法三：使用在线构建服务

如果没有本地 Android 开发环境，可以使用以下在线服务：

### 1. GitHub Actions
创建 `.github/workflows/build.yml` 文件，使用 GitHub Actions 自动构建。

### 2. Azure Pipelines
配置 Azure DevOps 进行云端构建。

### 3. Ionic Appflow
使用 Ionic 的云端构建服务。

---

## 方法四：PWA 安装（最简单）

无需构建 APK，直接将网页安装到手机：

### Android Chrome
1. 用 Chrome 浏览器打开游戏网页
2. 点击菜单（三个点）
3. 选择"添加到主屏幕"
4. 游戏将以全屏应用形式运行

### iOS Safari
1. 用 Safari 打开游戏网页
2. 点击分享按钮
3. 选择"添加到主屏幕"

---

## 常见问题

### 1. JAVA_HOME 未设置
```bash
# Windows
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.16.101-hotspot

# Linux/Mac
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
```

### 2. ANDROID_HOME 未设置
```bash
# Windows
set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk

# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
```

### 3. Gradle 构建失败
尝试清理项目：
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### 4. 签名 APK（发布版）
```bash
# 生成密钥库
keytool -genkey -v -keystore redalert.keystore -alias redalert -keyalg RSA -keysize 2048 -validity 10000

# 构建发布版
cd android
./gradlew assembleRelease
```

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `capacitor.config.json` | Capacitor 配置文件 |
| `android/` | Android 原生项目目录 |
| `www/` | Web 资源目录 |
| `build.sh` | Linux/Mac 构建脚本 |
| `build.bat` | Windows 构建脚本 |

---

## 注意事项

1. 首次构建需要下载 Gradle 和依赖库，可能需要较长时间
2. 确保网络连接稳定
3. 构建需要至少 4GB 可用磁盘空间
4. 建议使用 SSD 以提高构建速度
