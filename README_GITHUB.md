# 红色警戒：共和国之辉 - 移动版

> ⚠️ 注意：这是一个粉丝制作的非官方项目，仅供学习交流使用。

## 游戏简介

《红色警戒：共和国之辉》移动版是一个基于 HTML5 Canvas 开发的即时战略游戏，完美适配手机屏幕操作。

## 在线试玩

🎮 **[点击这里在线游玩](https://你的github用户名.github.io/red-alert-mobile)**

## 下载 APK

📱 **[下载最新 APK](https://github.com/你的github用户名/red-alert-mobile/releases/latest)**

## 功能特性

### 核心玩法
- ✅ 经典 RTS 玩法：建造基地、采集资源、训练部队
- ✅ 战争迷雾系统，需要雷达建筑驱散
- ✅ 建筑必须在已有建筑附近建造
- ✅ 建筑建造需要消耗时间

### 单位系统
- ✅ 战斗升级系统（最高3级）
- ✅ 间谍窃取升级（最高1级）
- ✅ 工程师可占领敌方建筑
- ✅ 间谍可伪装并窃取科技
- ✅ 军犬可发现间谍

### 阵营
- 🔴 **苏联**：重装甲、强力单位（犀牛坦克、天启坦克、V3火箭车）
- 🔵 **盟军**：高科技、空军优势（灰熊坦克、光棱坦克、幻影坦克）

## 游戏截图

![游戏截图1](screenshots/screenshot1.png)
![游戏截图2](screenshots/screenshot2.png)

## 操作说明

### 触屏操作
- **拖动**：移动视角
- **点击**：选择单位/建筑
- **双击**：选中同类型单位
- **框选**：选择多个单位

### 按钮
- **建筑**：打开建筑菜单
- **单位**：打开单位训练菜单
- **选择**：切换到选择模式
- **攻击**：切换到攻击模式

## 技术栈

- HTML5 Canvas
- JavaScript (ES6+)
- CSS3
- Capacitor (用于构建 APK)

## 本地开发

```bash
# 克隆项目
git clone https://github.com/你的github用户名/red-alert-mobile.git

# 进入目录
cd red-alert-mobile

# 安装依赖
npm install

# 启动本地服务器
npx http-server -p 8080

# 浏览器访问 http://localhost:8080
```

## 构建 APK

项目使用 GitHub Actions 自动构建 APK，每次推送到 main 分支都会自动生成。

你也可以本地构建：

```bash
# 安装 Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 添加 Android 平台
npx cap add android

# 同步项目
npx cap sync android

# 构建 APK
cd android
./gradlew assembleDebug
```

APK 将生成在 `android/app/build/outputs/apk/debug/app-debug.apk`

## 项目结构

```
red-alert-mobile/
├── .github/workflows/     # GitHub Actions 配置
├── www/                   # Web 资源
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── android/               # Android 原生项目（自动生成）
├── capacitor.config.json  # Capacitor 配置
├── package.json
└── README.md
```

## 更新日志

### v1.0.0 (2024-03-25)
- 🎉 首次发布
- ✅ 实现完整的 RTS 游戏机制
- ✅ 支持苏联和盟军两个阵营
- ✅ 添加 AI 对手
- ✅ 支持触屏操作

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- 原版游戏《红色警戒2：共和国之辉》由 Westwood Studios 开发
- 本项目仅供学习交流，不用于商业用途
