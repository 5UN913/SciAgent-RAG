#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -d ".venv" ]]; then
  echo "创建虚拟环境..."
  uv venv
fi

echo "激活虚拟环境..."
# shellcheck disable=SC1091
source .venv/bin/activate

echo "安装依赖（可重复执行，不会重复安装）的..."
uv pip install -e .

echo "启动后端服务: http://127.0.0.1:8001"
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
