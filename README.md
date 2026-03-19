# SciAgent-RAG - AI 交互科学仿真平台

基于多智能体与 RAG 的交互式高中物理/化学教学系统

## 项目简介

SciAgent-RAG 是一个智能物理/化学教学辅助平台，结合了检索增强生成（RAG）、多智能体系统和 3D 物理仿真技术。学生可以输入物理题目，系统会自动生成详细解答，并通过 3D 动画直观展示物理过程。

## 核心功能

- 🤖 **智能问答**：基于 RAG 技术，从教材中检索相关知识
- 📚 **教材处理**：支持 PDF 教材上传、切片和向量化
- 🎬 **3D 物理仿真**：使用 Three.js 内置物理引擎
- 🎯 **自动场景识别**：根据题目内容自动选择合适的物理场景
- ⚙️ **参数可调**：自由调整物理参数（高度、速度、重力加速度等）
- 📷 **多模态支持**：支持 OCR 识别手写题目和实验截图

## 支持的物理场景

- ✅ **平抛运动** (projectile_motion)
- ✅ **牛顿第二定律** (newton_second_law)
- 🔄 **单摆** (pendulum) - 待实现
- 🔄 **弹簧振子** (spring) - 待实现
- 🔄 **碰撞** (collision) - 待实现

## 技术栈

- **后端**：Python, FastAPI, ChromaDB, LangGraph, LangChain
- **前端**：React, Vite, Three.js
- **仿真引擎**：Three.js（内置，开箱即用）
- **向量数据库**：ChromaDB
- **包管理**：uv (Python), npm (Node.js)

## 项目结构

```
SciAgent-RAG/
├── sciagent-rag/
│   ├── backend/                # 后端服务
│   │   ├── main.py             # FastAPI 主入口
│   │   ├── rag_agent.py        # RAG 智能体
│   │   ├── vector_db_manager.py # 向量数据库管理
│   │   ├── chromadb/           # ChromaDB 数据目录
│   │   ├── uploads/            # 上传的教材
│   │   └── schemas/            # JSON Schema 定义
│   ├── frontend/               # 前端应用
│   │   ├── src/
│   │   │   ├── App.jsx         # 主应用组件
│   │   │   └── RAGManager.jsx  # 知识库管理
│   │   └── package.json
│   ├── start-all.sh            # 一键启动脚本
│   └── data/
└── README.md
```

## 快速开始

### 前置要求

- Python 3.12+
- Node.js 18+

### 一键启动

```bash
cd sciagent-rag
./start-all.sh
```

### 或手动启动

#### 1. 启动后端

```bash
cd sciagent-rag/backend
source .venv/bin/activate
uv pip install -e .
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

#### 2. 启动前端

```bash
cd sciagent-rag/frontend
npm install
npm run dev
```

#### 3. 访问应用

打开浏览器访问：http://localhost:3001 或 http://localhost:3000

## 使用说明

### 1. 输入物理题目

在右侧 AI 助手的输入框中输入物理题目，例如：

```
平抛运动基础题：一个小球从高度 h = 20 m 的桌面水平抛出，初速度 v0 = 5 m/s，不计空气阻力，重力加速度 g = 10 m/s²。求：小球在空中运动的时间、水平位移和落地时的竖直速度。
```

### 2. 自动解答和仿真

点击"发送"后，系统会：
1. 从向量数据库中检索相关知识
2. 生成详细的解答
3. 自动识别题目类型（平抛运动/牛顿定律等）
4. 生成仿真命令
5. 自动播放 3D 动画

### 3. 调整参数

在左侧"仿真参数"面板中，您可以自由调整：
- **初始高度 h** (0.5 - 10 m)
- **初速度 v₀** (1 - 20 m/s)
- **重力加速度 g** (1 - 20 m/s²)
- **时间速度** (0.1 - 5 倍速)

调整后点击"平抛运动仿真"按钮即可看到新参数的效果。

### 4. 管理知识库

在 RAG 管理页面（导航栏点击"知识库管理"），您可以：
- 上传新的 PDF 教材
- 处理文档并添加到向量数据库
- 管理已上传的文档

## 配置说明

主要配置在 `backend/.env` 文件中：

```env
# LLM 配置
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_MODEL_ID=deepseek-ai/DeepSeek-V3.1-Terminus
LLM_API_KEY=your_api_key_here

# 仿真配置（使用内置 Three.js）
SIMULATION_ENGINE=threejs

# 服务器配置
HOST=0.0.0.0
PORT=8001

# 数据库配置
CHROMA_DB_PATH=./chromadb
```

## API 接口

### 主要接口

- `POST /api/rag/query` - RAG 问答
- `POST /api/command/generate` - 生成仿真命令
- `POST /api/command/execute` - 执行仿真命令
- `POST /api/ocr/extract` - OCR 文本提取
- `WebSocket /ws/simulation` - 实时仿真通信

### 管理接口

- `GET /api/rag/stats` - 获取数据库统计
- `POST /api/rag/documents/upload` - 上传文档
- `POST /api/rag/documents/process` - 处理文档
- `GET /api/rag/documents` - 列出文档
- `DELETE /api/rag/documents/{filename}` - 删除文档
- `DELETE /api/rag/collection/clear` - 清空向量数据库

## 命令协议

仿真命令遵循统一的 JSON Schema（定义在 `backend/schemas/simulation_command.json`）：

```json
{
  "command": "start_simulation",
  "target": "projectile_motion",
  "parameters": {
    "h": 2,
    "v0": 5,
    "g": 10
  },
  "reasoning": "开始平抛运动实验"
}
```

### 可用命令

- `start_simulation` - 开始仿真
- `pause_simulation` - 暂停仿真
- `reset_simulation` - 重置仿真
- `set_parameter` - 设置参数
- `play_animation` - 播放动画

## 故障排除

### 前端无法连接后端

- 确认后端正在运行（端口 8001）
- 检查浏览器控制台的网络请求
- 确认 CORS 配置正确

### 向量数据库查询问题

- 确认教材已正确处理并添加到数据库
- 检查块大小和重叠设置
- 查看后端日志

## 开发计划

- [ ] 添加更多物理场景（单摆、弹簧、碰撞）
- [ ] 支持化学实验仿真
- [ ] 增强视觉效果（轨迹、粒子系统）
- [ ] 添加用户账号和进度保存
- [ ] 支持更多题型的自动识别
- [ ] 移动端适配

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目采用 MIT 许可证。

## 致谢

- OpenAI / LangChain 社区
- Three.js 社区
- ChromaDB
