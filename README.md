# 红色警戒：共和国之辉 - 移动版

## 项目简介

这是一个基于 HTML5 Canvas 和 JavaScript 开发的红色警戒风格即时战略游戏，完美适配手机屏幕。

## 功能特性

### 核心游戏机制
- ✅ 经典 RTS 玩法：建造基地、采集资源、训练部队、征服敌人
- ✅ 战争迷雾系统：需要雷达建筑驱散迷雾
- ✅ 建筑限制：只能在已有建筑附近建造
- ✅ 建造时间：建筑需要耗费时间建造

### 单位系统
- ✅ 单位升级：战斗升级（最高3级）+ 间谍窃取升级（最高1级）
- ✅ 工程师：可占领敌方建筑
- ✅ 间谍：可伪装、可窃取科技
- ✅ 军犬：可发现间谍

### 阵营
- 苏联：重装甲、强力单位
- 盟军：高科技、空军优势

### 建筑
- 建造厂：基地核心
- 发电厂：提供电力
- 矿厂：采集资源
- 兵营：训练步兵
- 战车工厂：生产载具
- 雷达：驱散战争迷雾
- 维修厂：维修载具
- 作战实验室：解锁高级科技

## 技术栈

- HTML5 Canvas
- JavaScript (ES6+)
- CSS3
- Cordova (用于打包 APK)

## 如何运行

### 网页版
1. 直接在浏览器中打开 `index.html` 文件
2. 或使用本地服务器：
   ```bash
   npx http-server -p 8080
   ```

### Android APK
1. 安装依赖：
   ```bash
   npm install
   ```

2. 添加 Android 平台：
   ```bash
   npx cordova platform add android
   ```

3. 构建 APK：
   ```bash
   npx cordova build android
   ```

4. APK 文件将生成在：
   ```
   platforms/android/app/build/outputs/apk/debug/app-debug.apk
   ```

## 游戏操作

### 触屏操作
- **单指拖动**：移动视角
- **单指点击**：选择单位/建筑
- **双指点击**：选中同类型单位
- **框选**：拖动选择多个单位

### 按钮
- **建筑**：打开建筑菜单
- **单位**：打开单位训练菜单
- **选择**：切换到选择模式
- **攻击**：切换到攻击模式

### 快捷键
- **ESC**：取消建造/选择
- **空格**：暂停游戏
- **Ctrl+S**：保存游戏
- **Ctrl+L**：加载游戏

## 项目结构

```
red-alert-mobile/
├── index.html          # 主页面
├── manifest.json       # PWA 配置
├── service-worker.js   # 服务工作线程
├── config.xml          # Cordova 配置
├── package.json        # NPM 配置
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── config.js       # 游戏配置
│   ├── utils.js        # 工具函数
│   ├── map.js          # 地图系统
│   ├── fog.js          # 战争迷雾
│   ├── building.js     # 建筑系统
│   ├── unit.js         # 单位系统
│   ├── economy.js      # 经济系统
│   ├── ai.js           # AI系统
│   ├── input.js        # 输入处理
│   ├── renderer.js     # 渲染器
│   ├── game.js         # 游戏主逻辑
│   └── main.js         # 主入口
└── assets/             # 资源文件
```

## 开发计划

- [ ] 添加更多单位类型
- [ ] 添加更多建筑类型
- [ ] 添加特殊武器（核弹、闪电风暴等）
- [ ] 添加多人对战模式
- [ ] 添加战役模式
- [ ] 添加音效和音乐
- [ ] 优化性能

## 许可证

MIT License
