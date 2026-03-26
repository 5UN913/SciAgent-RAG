# 项目目录结构

```
SciAgent-RAG/
├── sciagent-rag/
│   ├── backend/                     # 后端服务
│   │   ├── chromadb/                # ChromaDB 向量数据库
│   │   │   ├── 94b37ac4-b7c6-4a62-a776-d9734ef9c54d/  # 数据库实例
│   │   │   │   ├── data_level0.bin
│   │   │   │   ├── header.bin
│   │   │   │   ├── length.bin
│   │   │   │   └── link_lists.bin
│   │   │   └── chroma.sqlite3       # SQLite 数据库文件
│   │   ├── schemas/                 # 数据模式定义
│   │   │   └── simulation_command.json
│   │   ├── .env                     # 环境配置文件
│   │   ├── .env.example             # 环境配置示例文件
│   │   ├── .gitignore               # Git 忽略文件
│   │   ├── .python-version          # Python 版本指定
│   │   ├── TREE.md                  # 后端目录结构
│   │   ├── command_prompt_manager.py # 提示词管理模块（更新为代码生成模式）
│   │   ├── config.py                # 配置管理模块
│   │   ├── langgraph_manager.py     # LangGraph 管理模块
│   │   ├── llm_factory.py           # LLM 工厂模块
│   │   ├── main.py                  # 主入口文件（新增 /api/code/generate 接口）
│   │   ├── multimodal_ocr_manager.py # OCR 管理模块
│   │   ├── process_all_books.py     # 批量处理书籍模块
│   │   ├── pyproject.toml           # Python 项目配置
│   │   ├── rag_agent.py             # RAG 管理模块（更新为代码生成）
│   │   ├── simulation_command_validator.py # 命令验证模块
│   │   ├── start.sh                 # 后端启动脚本
│   │   ├── test_llm_config.py       # LLM 配置测试
│   │   ├── test_vector_db.py        # 向量数据库测试
│   │   ├── vector_db_manager.py     # 向量数据库管理模块
│   │   ├── verify_rag.py            # RAG 验证模块
│   │   └── uv.lock                  # 依赖锁定文件
│   ├── data/                        # 数据目录
│   │   └── experiments/             # 实验数据
│   │       └── physics_experiment_1.md
│   ├── frontend/                    # 前端应用
│   │   ├── src/                     # 源代码
│   │   │   ├── App.jsx              # 主应用组件（更新为代码执行引擎）
│   │   │   ├── DebugAPI.jsx         # API 调试组件
│   │   │   ├── Navigation.jsx       # 导航组件
│   │   │   ├── RAGManager.jsx       # 知识库管理
│   │   │   ├── index.css            # 全局样式
│   │   │   └── main.jsx             # 前端入口文件
│   │   ├── index.html               # HTML 模板
│   │   ├── package-lock.json        # npm 依赖锁定文件
│   │   ├── package.json             # npm 项目配置（新增 @dimforge/rapier3d-compat）
│   │   ├── start.sh                 # 前端启动脚本
│   │   └── vite.config.js           # Vite 配置文件
│   ├── start-all.sh                 # 一键启动脚本（已更新）
│   └── TREE.md                      # 项目目录结构
├── .gitignore                       # Git 忽略文件
├── LICENSE                          # 许可证文件
├── README.md                        # 项目说明（已更新）
├── TREE.md                          # 目录结构（本文件）
└── 开题报告.pages                    # 项目开题报告
```

## 目录说明

- **backend/**: 后端服务代码，包含 RAG 核心功能、数据库管理和 API 接口
  - 新增 `/api/code/generate` 接口用于生成 Three.js 动画代码
  - 提示词系统已更新为代码生成模式
- **data/**: 存储实验数据和其他相关数据
- **frontend/**: 前端应用代码，提供用户界面
  - 新增 Rapier3D 物理引擎支持
  - 新增代码执行沙箱环境
  - 支持动态执行 LLM 生成的 Three.js 代码
- **chromadb/**: 向量数据库，用于存储和检索嵌入向量
- **schemas/**: 数据模式定义，用于验证输入数据

## 主要文件说明

- **backend/main.py**: 后端服务的主入口文件，启动 FastAPI 应用，新增 `/api/code/generate` 接口
- **backend/rag_agent.py**: RAG 核心功能实现，已更新为生成 Three.js 代码
- **backend/command_prompt_manager.py**: 提示词管理模块，已更新为代码生成模式
- **backend/vector_db_manager.py**: ChromaDB 向量数据库管理
- **frontend/src/App.jsx**: 前端主应用组件，包含代码执行引擎和 Rapier 物理引擎集成
- **frontend/package.json**: npm 项目配置，新增 `@dimforge/rapier3d-compat` 依赖
- **data/experiments/**: 存储实验数据文件
- **start-all.sh**: 一键启动脚本，已更新为 LLM 代码驱动模式

## 系统变更说明

### v2.0 - LLM 代码驱动模式

- 🔄 **架构升级**：从硬编码预设动画升级为 LLM 动态代码生成
- 🎮 **物理引擎**：集成 Rapier3D 物理引擎，支持真实物理效果
- 🛡️ **安全执行**：前端新增代码沙箱执行环境
- 📝 **API 变更**：新增 `/api/code/generate` 接口，保留原命令接口向后兼容
- 📚 **文档更新**：README 和启动脚本已同步更新
- 🎯 **设计理念**：采用「兵来将挡，水来土掩」的灵活设计，无预设场景限制，用户给什么题目就生成什么场景

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
