# SciAgent-RAG 改进 - Product Requirement Document

## Overview
- **Summary**: 添加 LaTeX 数学公式渲染功能和移除预设仿真按钮，提升用户体验
- **Purpose**: 解决当前前端显示原始 LaTeX 代码而非渲染后数学公式的问题，同时根据 README 设计理念移除预设按钮，采用完全由题目驱动的动态生成
- **Target Users**: 高中物理/化学学生

## Goals
- 前端能够正确渲染 AI 回答中的 LaTeX 数学公式
- 移除预设的"平抛运动仿真"和"牛顿定律仿真"按钮
- 保持系统完全遵循 README 中"题目驱动生成"的设计理念

## Non-Goals (Out of Scope)
- 不改变 RAG 知识库的核心检索逻辑
- 不改变 Three.js 代码生成机制
- 不增加新的物理场景类型
- 不修改后端 RAG 提示词（保持 LaTeX 输出）

## Background & Context
当前系统存在两个问题：
1. AI 返回的回答包含 LaTeX 公式，但前端显示的是原始 LaTeX 代码，而不是渲染后的数学公式
2. 前端有预设的仿真按钮，与 README 中"题目驱动生成"的理念不符

根据 README，系统应该采用"兵来将挡，水来土掩"的灵活设计：
- 无预设场景限制
- 题目驱动生成：用户给什么物理题目，就生成近乎一比一的物理场景

## Functional Requirements
- **FR-1**: 在前端添加 LaTeX 数学公式渲染功能
- **FR-2**: 移除前端预设的"平抛运动仿真"和"牛顿定律仿真"按钮
- **FR-3**: 保留"重置"按钮，用于清空当前场景

## Non-Functional Requirements
- **NFR-1**: LaTeX 公式渲染应清晰、美观，适合高中生阅读
- **NFR-2**: 界面保持简洁，不增加不必要的元素

## Constraints
- **Technical**: 使用现有的 React 技术栈，添加 KaTeX 或 MathJax 库
- **Business**: 必须保持向后兼容性，不破坏现有功能
- **Dependencies**: 依赖现有的 LLM API 和向量数据库

## Assumptions
- 用户主要通过输入题目来获得解答和仿真
- 用户不需要预设按钮就能理解如何使用系统
- AI 继续输出 LaTeX 格式的数学公式是正确的

## Acceptance Criteria

### AC-1: 前端正确渲染 LaTeX 公式
- **Given**: AI 返回包含 LaTeX 公式的回答
- **When**: 前端显示该回答
- **Then**: LaTeX 公式被正确渲染为易读的数学公式，而不是原始代码
- **Verification**: `human-judgment`

### AC-2: 移除预设仿真按钮
- **Given**: 用户访问仿真平台首页
- **When**: 用户查看控制区域
- **Then**: 不再显示"平抛运动仿真"和"牛顿定律仿真"按钮，只保留"重置"按钮
- **Verification**: `programmatic`

### AC-3: 保持重置功能正常
- **Given**: 场景中有正在运行的动画
- **When**: 用户点击"重置"按钮
- **Then**: 场景被清空，所有动画停止
- **Verification**: `programmatic`

## Open Questions
- 无
