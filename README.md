<<<<<<< HEAD
# SciAgent-RAG
<<<<<<< HEAD
=======
# SciAgent-RAG(开发阶段，暂不可用)
>>>>>>> f06ee1a67557df1606798287ac42f5eb82444922

## 项目简介

SciAgent-RAG 是一个基于检索增强生成（RAG）技术的科学助手系统，旨在帮助用户处理和分析科学文献、数据和实验信息。

## 项目结构

```
SciAgent-RAG/
├── sciagent-rag/
│   ├── backend/         # 后端服务
│   │   ├── chromadb/    # ChromaDB 向量数据库
│   │   ├── schemas/     # 数据模式定义
│   │   ├── main.py      # 主入口文件
│   │   └── ...
│   ├── data/            # 数据目录
│   │   └── experiments/ # 实验数据
│   └── frontend/        # 前端应用
│       ├── src/         # 源代码
│       └── ...
├── README.md            # 项目说明
└── TREE.md              # 目录结构
```

## 主要功能

- 科学文献检索和分析
- 实验数据管理和处理
- 基于RAG的智能问答系统
- 多模态数据处理（文本、图像等）

## 技术栈

- **后端**：Python, FastAPI, ChromaDB, LangGraph
- **前端**：React, Vite
- **数据库**：ChromaDB (向量数据库)

## 安装和运行

### 后端

1. 进入后端目录
   ```bash
   cd sciagent-rag/backend
   ```

2. 安装依赖
   ```bash
   pip install -e .
   ```

3. 运行服务
   ```bash
   python main.py
   ```

### 前端

1. 进入前端目录
   ```bash
   cd sciagent-rag/frontend
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 运行开发服务器
   ```bash
   npm run dev
   ```

## 配置

后端服务的配置文件位于 `backend/.env`，可根据需要修改配置参数。

## 使用说明

1. 启动后端和前端服务
2. 在浏览器中访问前端应用
3. 上传或输入科学文献、实验数据
4. 使用智能问答功能获取分析结果

## 贡献

欢迎贡献代码和提出建议！

## 许可证

本项目采用 MIT 许可证。
<<<<<<< HEAD
=======
SciAgent: 深度集成的智能交互科学仿真系统
>>>>>>> 0eebfb6a120471cc252ba040298ec27711386f9b
=======
>>>>>>> f06ee1a67557df1606798287ac42f5eb82444922
