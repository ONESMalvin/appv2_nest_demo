#!/bin/bash

echo "🚀 启动开发环境..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

if [ ! -d "web/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd web && npm install && cd ..
fi

echo "🔥 启动前后端开发服务器..."
echo "🔥 启动本地代理服务器..."
echo "📱 前端开发服务器: http://localhost:8080"
echo "🔧 后端API服务器: http://localhost:8083"
echo "📄 静态文件服务: http://localhost:8083/static"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 使用 concurrently 同时启动前后端
npm run dev
