#!/usr/bin/env bash
set -euo pipefail

# SciAgent-RAG 一键启动脚本
# 使用内置 Three.js 模式

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  SciAgent-RAG 启动脚本"
echo "=========================================="
echo ""

# 检查环境
check_env() {
  echo "✅ 使用内置 Three.js 仿真引擎"
  echo ""
}

# 启动后端
start_backend() {
  echo "🚀 启动后端服务..."
  cd "$ROOT_DIR/backend"
  
  if [[ ! -d ".venv" ]]; then
    echo "   创建虚拟环境..."
    if command -v uv &> /dev/null; then
      uv venv
    else
      echo "⚠️  uv 未找到，尝试使用 python venv"
      python3 -m venv .venv
    fi
  fi
  
  echo "   激活虚拟环境..."
  source .venv/bin/activate
  
  echo "   安装/更新依赖..."
  if command -v uv &> /dev/null; then
    uv pip install -e .
  else
    pip install -e .
  fi
  
  echo "   启动 FastAPI 服务器 (端口 8001)..."
  uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
  BACKEND_PID=$!
  
  echo "   后端 PID: $BACKEND_PID"
  echo ""
}

# 启动前端
start_frontend() {
  echo "🚀 启动前端服务..."
  cd "$ROOT_DIR/frontend"
  
  echo "   安装/更新依赖..."
  npm install
  
  echo "   启动 Vite 开发服务器..."
  npm run dev &
  FRONTEND_PID=$!
  
  echo "   前端 PID: $FRONTEND_PID"
  echo ""
}

# 等待服务启动
wait_for_services() {
  echo "⏳ 等待服务启动..."
  
  # 等待后端
  local count=0
  while [ $count -lt 30 ]; do
    if curl -s "http://localhost:8001/health" > /dev/null 2>&1; then
      echo "✅ 后端服务已就绪"
      break
    fi
    sleep 1
    count=$((count + 1))
  done
  
  echo ""
}

# 清理函数
cleanup() {
  echo ""
  echo "🛑 正在停止服务..."
  
  if [ ! -z "${BACKEND_PID:-}" ]; then
    if kill -0 $BACKEND_PID 2>/dev/null; then
      echo "   停止后端 (PID: $BACKEND_PID)..."
      kill $BACKEND_PID 2>/dev/null || true
    fi
  fi
  
  if [ ! -z "${FRONTEND_PID:-}" ]; then
    if kill -0 $FRONTEND_PID 2>/dev/null; then
      echo "   停止前端 (PID: $FRONTEND_PID)..."
      kill $FRONTEND_PID 2>/dev/null || true
    fi
  fi
  
  echo "✅ 所有服务已停止"
  exit 0
}

# 主函数
main() {
  # 显示欢迎信息
  echo "检查环境..."
  check_env
  
  # 设置信号处理
  trap cleanup SIGINT SIGTERM
  
  # 启动服务
  start_backend
  sleep 3
  start_frontend
  
  # 等待并显示信息
  wait_for_services
  
  echo "=========================================="
  echo "  🎉 所有服务已启动成功！"
  echo "=========================================="
  echo ""
  echo "📱 前端地址:  http://localhost:3000"
  echo "              或 http://localhost:3001"
  echo "🔧 后端地址:  http://localhost:8001"
  echo ""
  echo "🎮 模式:      内置 Three.js 仿真引擎"
  echo ""
  echo "按 Ctrl+C 停止所有服务"
  echo "=========================================="
  echo ""
  
  # 等待子进程
  wait
}

# 运行主函数
main
