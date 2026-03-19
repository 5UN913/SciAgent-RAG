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
│   │   ├── .gitignore               # Git 忽略文件
│   │   ├── .python-version          # Python 版本指定
│   │   ├── README.md                # 后端说明文档
│   │   ├── vector_db_manager.py     # ChromaDB 向量数据库管理模块
│   │   ├── simulation_command_validator.py # 仿真命令验证模块
│   │   ├── config.py                # 配置管理模块
│   │   ├── langgraph_manager.py     # LangGraph 管理模块
│   │   ├── main.py                  # 主入口文件
│   │   ├── multimodal_ocr_manager.py# OCR 多模态识别模块
│   │   ├── command_prompt_manager.py# 命令提示词管理模块
│   │   ├── pyproject.toml           # Python 项目配置
│   │   ├── rag_agent.py             # RAG & 命令生成管理模块
│   │   └── uv.lock                  # 依赖锁定文件
│   ├── data/                        # 数据目录
│   │   └── experiments/             # 实验数据
│   │       └── physics_experiment_1.md
│   └── frontend/                    # 前端应用
│       ├── src/                     # 源代码
│       │   ├── App.jsx              # 主应用组件
│       │   ├── index.css            # 全局样式
│       │   └── main.jsx             # 前端入口文件
│       ├── index.html               # HTML 模板
│       ├── package-lock.json        # npm 依赖锁定文件
│       ├── package.json             # npm 项目配置
│       └── vite.config.js           # Vite 配置文件
├── README.md                        # 项目说明
├── TREE.md                          # 目录结构
└── 开题报告.pages                    # 项目开题报告
```

## 目录说明

- **backend/**: 后端服务代码，包含RAG核心功能、数据库管理和API接口
- **data/**: 存储实验数据和其他相关数据
- **frontend/**: 前端应用代码，提供用户界面
- **chromadb/**: 向量数据库，用于存储和检索嵌入向量
- **schemas/**: 数据模式定义，用于验证输入数据

## 主要文件说明

- **backend/main.py**: 后端服务的主入口文件，启动FastAPI应用
- **backend/rag_agent.py**: RAG 与命令生成核心逻辑实现
- **backend/vector_db_manager.py**: ChromaDB 向量数据库管理
- **backend/simulation_command_validator.py**: 仿真命令 JSON Schema 验证
- **backend/command_prompt_manager.py**: 命令生成提示词管理
- **backend/multimodal_ocr_manager.py**: OCR 多模态文本提取
- **frontend/src/App.jsx**: 前端主应用组件
- **data/experiments/**: 存储实验数据文件