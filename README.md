# SciAgent-RAG - AI 交互科学仿真平台

基于多智能体与 RAG 的交互式高中物理/化学教学系统

## 项目简介

SciAgent-RAG 是一个智能物理/化学教学辅助平台，结合了检索增强生成（RAG）、多智能体系统和 3D 物理仿真技术。学生可以输入物理题目，系统会自动生成详细解答，并通过 3D 动画直观展示物理过程。

## 核心功能

- 🤖 **智能问答**：基于 RAG 技术，从教材中检索相关知识
- 📚 **教材处理**：支持 PDF 教材上传、切片和向量化
- 🎬 **3D 物理仿真**：使用 Three.js + Rapier3D 物理引擎，支持 LLM 动态生成动画代码
- 🎯 **自动场景识别**：根据题目内容自动选择合适的物理场景
- ⚙️ **灵活动画生成**：LLM 直接生成 Three.js 代码，支持自由定制物理效果
- 📷 **多模态支持**：支持 OCR 识别手写题目和实验截图

## 灵活的物理场景生成

系统采用 **「兵来将挡，水来土掩」** 的灵活设计理念：

- 🎯 **无预设场景限制**：不局限于固定的场景列表
- 📐 **题目驱动生成**：用户给什么物理题目，就生成近乎一比一的物理场景
- ⚙️ **参数可调整**：生成的场景支持参数实时调整
- 👁️ **动态观察**：修改参数后可立即观察变化

### 示例应用场景

系统可以处理但不限于以下类型的题目：

- **平抛运动**：小球从桌面水平抛出
- **自由落体**：物体从高处自由下落
- **牛顿第二定律**：滑块在力的作用下加速运动
- **单摆**：小球在重力作用下来回摆动
- **弹簧振子**：物体在弹簧作用下振动
- **碰撞**：两个物体发生弹性或非弹性碰撞
- **斜面运动**：物体沿斜面下滑
- **圆周运动**：物体做圆周运动
- **...以及更多**：任何你能描述的物理场景！

## 技术栈

- **后端**：Python, FastAPI, ChromaDB, LangGraph, LangChain
- **前端**：React, Vite, Three.js
- **物理引擎**：Rapier3D（高性能物理模拟）
- **仿真模式**：LLM 代码驱动（动态生成 Three.js 代码）
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
│   │   │   ├── App.jsx         # 主应用组件（代码执行引擎）
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

打开浏览器访问：http://localhost:3000

## 系统架构说明

### LLM 代码驱动模式

新系统采用 LLM 直接生成 Three.js 代码的方式，提供更大的灵活性：

1. **代码生成**：LLM 根据问题描述生成完整的 JavaScript 代码
2. **沙箱执行**：前端在安全的沙箱环境中执行代码
3. **物理引擎**：集成 Rapier3D 支持真实的物理效果

### 前端代码执行 API

生成的代码可以使用以下已初始化的变量和函数：

```javascript
// 库
THREE        // Three.js
RAPIER       // Rapier3D 物理引擎

// 渲染系统
scene        // THREE.Scene 实例
camera       // THREE.PerspectiveCamera 实例
renderer     // THREE.WebGLRenderer 实例
world        // RAPIER.World 物理世界实例

// 动画控制
animate(callback)    // 注册动画回调，接收 deltaTime
stopAnimation()      // 停止所有动画
```

### 代码结构示例

```javascript
const objects = [];

function setupScene() {
  // 创建场景对象
  const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(-2, 2.2, 0);
  scene.add(ball);
  objects.push(ball);
}

function update(deltaTime) {
  // 每帧更新逻辑
  const ball = objects[0];
  ball.position.x += 0.1 * deltaTime;
}

function cleanup() {
  // 清理资源
  objects.forEach(obj => scene.remove(obj));
}

// 启动动画
setupScene();
animate(update);
```

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
4. 生成 Three.js 动画代码
5. 动态执行代码并播放 3D 动画

### 3. 快速测试按钮

页面提供了预设的快速测试按钮：
- **平抛运动仿真**：直接运行平抛运动示例
- **牛顿定律仿真**：直接运行牛顿第二定律示例
- **重置**：清空当前场景

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

# 仿真配置（使用 LLM 代码驱动 + Rapier）
SIMULATION_ENGINE=code-driven

# 服务器配置
HOST=0.0.0.0
PORT=8001

# 数据库配置
CHROMA_DB_PATH=./chromadb
```

## API 接口

### 主要接口

- `POST /api/rag/query` - RAG 问答
- `POST /api/code/generate` - 生成 Three.js 动画代码（新）
- `POST /api/command/generate` - 生成仿真命令（保留向后兼容）
- `POST /api/command/execute` - 执行仿真命令（保留向后兼容）
- `POST /api/ocr/extract` - OCR 文本提取
- `WebSocket /ws/simulation` - 实时仿真通信

### 管理接口

- `GET /api/rag/stats` - 获取数据库统计
- `POST /api/rag/documents/upload` - 上传文档
- `POST /api/rag/documents/process` - 处理文档
- `GET /api/rag/documents` - 列出文档
- `DELETE /api/rag/documents/{filename}` - 删除文档
- `DELETE /api/rag/collection/clear` - 清空向量数据库

## 新代码生成接口说明

### POST /api/code/generate

生成 Three.js 动画代码的接口。

**请求体：**
```json
{
  "question": "演示平抛运动"
}
```

**响应：**
```json
{
  "status": "success",
  "code": "// 平抛运动代码...",
  "reasoning": "生成平抛运动实验代码...",
  "raw_response": "原始 LLM 响应"
}
```

## 故障排除

### 前端无法连接后端

- 确认后端正在运行（端口 8001）
- 检查浏览器控制台的网络请求
- 确认 CORS 配置正确

### 代码执行错误

- 检查 LLM 生成的代码格式是否正确
- 查看浏览器控制台的错误信息
- 确认代码使用了正确的 API（THREE, scene, animate 等）

### 向量数据库查询问题

- 确认教材已正确处理并添加到数据库
- 检查块大小和重叠设置
- 查看后端日志

## 开发计划

- [ ] 可视化参数控制面板（让用户更方便地调整生成场景的参数）
- [ ] 支持化学实验仿真
- [ ] 增强视觉效果（轨迹、粒子系统、碰撞特效）
- [ ] 添加用户账号和进度保存
- [ ] 移动端适配
- [ ] 代码编辑器功能（允许用户查看和编辑 LLM 生成的代码）
- [ ] 场景保存和加载功能
- [ ] 多语言支持

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目采用 MIT 许可证。

## 致谢

- OpenAI / LangChain 社区
- Three.js 社区
- Rapier3D 物理引擎
- ChromaDB
