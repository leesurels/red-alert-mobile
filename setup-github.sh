#!/bin/bash

# GitHub 仓库初始化脚本
# 使用此脚本将项目推送到 GitHub 并启用自动构建

echo "=========================================="
echo "GitHub 仓库初始化脚本"
echo "=========================================="
echo ""

# 检查 git
if ! command -v git &> /dev/null; then
    echo "错误：未找到 git，请先安装 git"
    exit 1
fi

# 获取 GitHub 用户名
echo "请输入你的 GitHub 用户名:"
read username

echo ""
echo "请输入仓库名称 (默认: red-alert-mobile):"
read repo_name
repo_name=${repo_name:-red-alert-mobile}

echo ""
echo "步骤说明:"
echo "1. 在 GitHub 上创建新仓库: https://github.com/new"
echo "2. 仓库名称: $repo_name"
echo "3. 不要初始化 README 或 .gitignore"
echo "4. 创建后按回车继续..."
read

# 初始化 git 仓库
echo ""
echo "正在初始化本地 git 仓库..."
git init

# 添加文件
echo "正在添加文件..."
git add .

# 提交
echo "正在提交..."
git commit -m "Initial commit: 红色警戒移动版 v1.0.0"

# 添加远程仓库
echo ""
echo "添加远程仓库..."
git remote add origin "https://github.com/$username/$repo_name.git"

# 推送
echo "正在推送到 GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "=========================================="
echo "完成！"
echo "=========================================="
echo ""
echo "GitHub 仓库地址:"
echo "  https://github.com/$username/$repo_name"
echo ""
echo "GitHub Actions 将自动构建 APK"
echo "构建完成后，你可以在以下地址下载:"
echo "  https://github.com/$username/$repo_name/releases"
echo ""
echo "在线试玩地址 (需要启用 GitHub Pages):"
echo "  https://$username.github.io/$repo_name"
echo ""
echo "启用 GitHub Pages 步骤:"
echo "1. 打开仓库 Settings"
echo "2. 找到 Pages 选项"
echo "3. Source 选择 Deploy from a branch"
echo "4. Branch 选择 main，文件夹选择 / (root)"
echo "5. 点击 Save"
echo ""
