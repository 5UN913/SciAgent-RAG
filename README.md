# SciAgent-RAG - AI 交互科学仿真平台

基于多智能体与 RAG 的交互式高中物理/化学教学系统

## 项目简介

SciAgent-RAG 是一个智能物理/化学教学辅助平台，结合了检索增强生成（RAG）、LangGraph 多智能体系统和 2D 扁平化物理仿真技术。学生可以输入物理题目，系统会自动生成详细解答，并通过 2D 教科书风格动画直观展示物理过程，配合速度箭头、运动轨迹、实时数据面板等可视化工具，帮助学生深入理解物理规律。

## 核心功能

- 🤖 **智能问答**：基于 RAG 技术，从教材中检索相关知识
- 📚 **教材处理**：支持 PDF 教材上传、切片和向量化
- 🎬 **2D 物理仿真**：使用 Three.js 正交相机（OrthographicCamera）渲染 2D 扁平化教科书风格动画，LLM 动态生成代码驱动
- 🎯 **自动场景识别**：根据题目内容自动提取物理参数和场景类型
- ⚙️ **灵活动画生成**：LLM 直接生成 Three.js 代码，支持自由定制物理效果
- 📷 **多模态支持**：支持 OCR 识别手写题目和实验截图
- 🎮 **动画控制**：播放/暂停/变速（0.25x–4x）/重播，实时显示仿真时间
- 📐 **物理可视化工具**：速度向量箭头、运动轨迹线、文字标注、虚线辅助线、实时数据 HUD 面板

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
- **前端**：React, Vite, Three.js（OrthographicCamera 2D 正交渲染模式）
- **仿真模式**：LLM 代码驱动（动态生成 Three.js 代码 + SimulationHelpers 可视化工具库）
- **多智能体流水线**：LangGraph StateGraph（Analyzer → Reasoner → CodeWriter → Validator）
- **向量数据库**：ChromaDB
- **包管理**：uv (Python), npm (Node.js)

## 项目结构

```
SciAgent-RAG/
├── sciagent-rag/
│   ├── backend/
│   │   ├── main.py                 # FastAPI 主入口
│   │   ├── solve_pipeline.py       # LangGraph 多智能体流水线
│   │   ├── rag_agent.py            # RAG 智能体
│   │   ├── vector_db_manager.py    # 向量数据库管理
│   │   ├── llm_factory.py          # LLM 工厂
│   │   ├── config.py               # 配置管理
│   │   └── schemas/                # JSON Schema
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.jsx             # 主应用路由
│   │   │   ├── components/
│   │   │   │   ├── SimulationCanvas.jsx    # 2D 渲染画布
│   │   │   │   ├── SimulationHelpers.js    # 物理可视化工具库
│   │   │   │   ├── AnimationControls.jsx   # 动画控制条
│   │   │   │   ├── CodeSandbox.js          # 代码沙箱执行
│   │   │   │   ├── ChatPanel.jsx           # AI 对话面板
│   │   │   │   └── SolutionDisplay.jsx     # 解答展示
│   │   │   ├── context/
│   │   │   │   └── SimulationContext.jsx   # 全局状态管理
│   │   │   ├── pages/
│   │   │   │   └── SimulationPage.jsx      # 仿真主页
│   │   │   └── presets/
│   │   │       ├── projectileMotion.js     # 平抛运动预设
│   │   │       └── newtonSecondLaw.js      # 牛顿第二定律预设
│   │   └── package.json
│   └── start-all.sh
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

### LangGraph 多智能体流水线

系统采用 LangGraph StateGraph 构建多智能体求解流水线，一次请求完成从题目分析到动画生成的全流程：

```
用户输入 → Analyzer → Reasoner → CodeWriter → Validator → 返回结果
                                      ↑            │
                                      └── retry ───┘ (最多重试2次)
```

1. **Analyzer（分析器）**：解析题目，提取物理参数和场景类型；支持 OCR 图片识别
2. **Reasoner（推理器）**：从 RAG 向量数据库检索相关教材，生成完整物理解答和步骤
3. **CodeWriter（代码生成器）**：根据解答和参数生成 Three.js 2D 仿真代码，自动使用可视化 Helper
4. **Validator（验证器）**：校验代码完整性和安全性，不合格则自动重试

统一求解 API `POST /solve` 封装了整个流水线，前端只需一次调用即可获得解答文本 + 仿真代码。

### 前端 2D 渲染架构

前端采用 Three.js OrthographicCamera 实现 2D 正交视图渲染：

- **XY 平面**：X 轴 = 水平方向（右为正），Y 轴 = 竖直方向（上为正）
- **扁平化风格**：使用 `MeshBasicMaterial` 纯色块，无光照，教科书插图风格
- **地面在 y=0**：所有物体放在 z=0 平面，相机正面俯视

### 前端代码执行 API

LLM 生成的代码在前端沙箱中执行，可使用以下已初始化的变量和函数：

```javascript
// ── 基础 API ──
THREE                // Three.js 库
scene                // THREE.Scene 实例
camera               // THREE.OrthographicCamera 实例（2D 正交视图）
renderer             // THREE.WebGLRenderer 实例

// ── 动画控制 ──
animate(callback)    // 注册动画回调，callback 接收 deltaTime（秒）
stopAnimation()      // 停止所有动画

// ── SimulationHelpers 可视化工具（scene 已预绑定，无需传入 scene 参数）──

// 向量箭头
createVector(origin, direction, length, color)
  // 创建箭头向量，返回 ArrowHelper（有 dispose() 方法）
updateVector(arrow, origin, direction, length)
  // 更新箭头的位置、方向和长度；direction 为零向量时自动隐藏

// 运动轨迹
createTrail(color, maxPoints)
  // 创建轨迹线，返回 { line, addPoint(vec), clear(), dispose() }
  // 内部使用环形缓冲区，默认最多 200 个点

// 文字标注
createLabel(text, position, fontSize, color)
  // 创建 Canvas 纹理文字 Sprite，返回 sprite（有 updateText(newText) 和 dispose() 方法）
updateLabel(sprite, text, position)
  // 更新标注的文字内容和位置

// 虚线辅助线
createDashedLine(from, to, color)
  // 创建两点之间的虚线，返回 Line（有 dispose() 方法）
updateDashedLine(line, from, to)
  // 更新虚线的两个端点

// 实时数据 HUD
createHUD()
  // 创建悬浮数据面板，返回 { element, update(data), dispose() }
  // update(data) 接收对象如 { 't (s)': 1.5, 'v (m/s)': 15 }，自动格式化显示
```

### 代码结构示例

以下是 2D 扁平风格的自由落体仿真示例：

```javascript
const g = 10;
const totalTime = 3;
const startHeight = 0.5 * g * totalTime * totalTime; // 45m

let ball, velocityArrow, trail, hud, accTime = 0;

function setupScene() {
  // 使用 CircleGeometry + MeshBasicMaterial（2D 扁平风格）
  const geom = new THREE.CircleGeometry(0.3, 32);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
  ball = new THREE.Mesh(geom, mat);
  ball.position.set(0, startHeight / 5, 0); // 缩放适配视图
  scene.add(ball);

  // 速度向量箭头
  velocityArrow = createVector(
    { x: 0, y: ball.position.y, z: 0 },
    { x: 0, y: -1, z: 0 }, 0.1, 0x00aa00
  );

  // 运动轨迹
  trail = createTrail(0x4488ff, 300);

  // 实时数据面板
  hud = createHUD();
}

function update(deltaTime) {
  if (accTime >= totalTime) return;
  accTime += deltaTime;
  const t = Math.min(accTime, totalTime);

  // 更新位置
  const y = startHeight / 5 - 0.5 * g * t * t / 5;
  ball.position.y = Math.max(0, y);

  // 更新可视化
  trail.addPoint({ x: 0, y: ball.position.y, z: 0 });
  const v = g * t;
  updateVector(velocityArrow,
    { x: 0.5, y: ball.position.y, z: 0 },
    { x: 0, y: -1, z: 0 }, v / 10
  );
  hud.update({ 't (s)': t, 'v (m/s)': v, 'h (m)': startHeight - 0.5 * g * t * t });
}

setupScene();
animate(update);
```

### 动画控制系统

前端内置动画控制条（`AnimationControls`），提供：

- ▶ / ⏸ **播放 / 暂停**：随时暂停观察物理状态
- ↻ **重播**：重置仿真从头播放
- **变速**：0.25x / 0.5x / 1x / 2x / 4x 倍速切换
- **时间显示**：实时显示仿真经过时间 `t = X.Xs`

## 使用说明

### 1. 输入物理题目

在 AI 对话面板中输入物理题目，例如：

```
平抛运动基础题：一个小球从高度 h = 20 m 的桌面水平抛出，初速度 v0 = 5 m/s，
不计空气阻力，重力加速度 g = 10 m/s²。求：小球在空中运动的时间、水平位移和
落地时的竖直速度。
```

### 2. 一键求解

点击"发送"后，系统通过 LangGraph 流水线自动完成：
1. **分析题目**：提取物理参数（h=20m, v0=5m/s, g=10m/s²）和场景类型
2. **RAG 检索**：从向量数据库中检索相关教材知识
3. **生成解答**：输出完整的物理推导和计算步骤
4. **生成代码**：自动生成 2D 仿真代码（含轨迹、速度箭头、HUD）
5. **播放动画**：在画布中渲染 2D 物理动画

解答文本和仿真动画同时呈现，使用动画控制条可暂停、变速、重播。

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

# 服务器配置
HOST=0.0.0.0
PORT=8001

# 数据库配置
CHROMA_DB_PATH=./chromadb
```

## API 接口

- ### 主要接口
-
- `POST /solve`（后端实际路由：/solve，等效统一求解接口，解答 + 仿真代码一体化，LangGraph 流水线驱动）
- `POST /rag/query` — RAG 问答
- `POST /code/generate` — 单独生成 Three.js 动画代码
- `POST /ocr/extract` — OCR 文本提取
- `WebSocket /ws/simulation` — 实时仿真通信

### 统一求解接口 POST /solve

一次请求完成从题目分析到仿真代码生成的全流程。

**请求体：**
```json
{
  "question": "一个小球从高度20m处自由下落，求落地时间和速度",
  "image_base64": null
}
```

**响应：**
```json
{
  "status": "success",
  "answer": "完整的物理解答文本...",
  "steps": ["步骤1: 分析已知量...", "步骤2: 应用公式..."],
  "simulation_code": "// Three.js 仿真代码...",
  "params": { "h": 20, "g": 10 },
  "reasoning": "为 free_fall 场景生成仿真代码",
  "error": null
}
```

### 前端沙箱 API 更新

- SimulationHelpers.js 新增/暴露的可视化工具函数：
- createVector(origin, direction, length, color)
- updateVector(arrow, origin, direction, length)
- createTrail(color, maxPoints)
- createLabel(text, position, fontSize, color)
- updateLabel(sprite, text, position)
- createDashedLine(from, to, color)
- updateDashedLine(line, from, to)
- createHUD(container)
- 通过这些工具，可以在前端沙箱中实现 2D 向量、轨迹、HUD 等可视化，且与 OrthographicCamera 的 2D 渲染模式无缝配合。

### 管理接口

- `GET /rag/stats` — 获取数据库统计
- `POST /rag/documents/upload` — 上传文档
- `POST /rag/documents/process` — 处理文档
- `GET /rag/documents` — 列出文档
- `DELETE /rag/documents/{filename}` — 删除文档
- `DELETE /rag/collection/clear` — 清空向量数据库

## 故障排除

### 前端无法连接后端

- 确认后端正在运行（端口 8001）
- 检查浏览器控制台的网络请求
- 确认 CORS 配置正确

### 代码执行错误

- 检查 LLM 生成的代码格式是否正确
- 查看浏览器控制台的错误信息
- 确认代码使用了正确的 API（THREE, scene, animate, createVector 等）

### 向量数据库查询问题

- 确认教材已正确处理并添加到数据库
- 检查块大小和重叠设置
- 查看后端日志

## 开发计划

- [x] 2D 扁平化教科书风格渲染（OrthographicCamera + MeshBasicMaterial）
- [x] 增强视觉效果（运动轨迹、速度向量箭头、实时数据 HUD）
- [x] 动画控制系统（播放/暂停/变速/重播）
- [x] LangGraph 多智能体求解流水线（Analyzer → Reasoner → CodeWriter → Validator）
- [x] 统一求解 API（POST /solve）
- [ ] 可视化参数控制面板
- [ ] 支持化学实验仿真
- [ ] 代码编辑器功能
- [ ] 场景保存和加载功能
- [ ] 移动端适配
- [ ] 用户账号和进度保存
- [ ] 更多物理场景预设（单摆、弹簧、碰撞等）
- [ ] 多语言支持

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目采用 MIT 许可证。

## 致谢

- OpenAI / LangChain / LangGraph 社区
- Three.js 社区
- ChromaDB
