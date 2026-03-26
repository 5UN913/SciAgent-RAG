# SciAgent-RAG 改进 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 添加 KaTeX 库到前端项目
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在前端 package.json 中添加 KaTeX 和 react-katex 依赖
  - 运行 npm install 安装依赖
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 检查 package.json 中是否包含 KaTeX 相关依赖
  - `programmatic` TR-1.2: 检查 node_modules 中是否安装了 KaTeX
- **Notes**: 使用 KaTeX 因为它比 MathJax 更轻量更快

## [ ] Task 2: 创建 LaTeX 渲染组件
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建一个可重用的 React 组件来渲染包含 LaTeX 的文本
  - 组件应能处理行内公式和块级公式
  - 集成 KaTeX CSS 样式
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement` TR-2.1: 检查组件能否正确渲染简单的 LaTeX 公式
  - `human-judgement` TR-2.2: 检查公式样式是否清晰美观
- **Notes**: 使用 react-katex 或自己封装 KaTeX

## [ ] Task 3: 在 App.jsx 中集成 LaTeX 渲染
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 修改 App.jsx 中的 AI 回答显示部分
  - 使用新创建的 LaTeX 渲染组件来显示 AI 回答
  - 确保同时支持普通文本和数学公式的混合显示
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement` TR-3.1: 检查 AI 回答中的 LaTeX 公式是否被正确渲染
  - `human-judgement` TR-3.2: 检查普通文本是否正常显示
- **Notes**: 可能需要预处理文本，确保 KaTeX 能正确识别公式

## [ ] Task 4: 移除前端预设仿真按钮
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改 App.jsx 中的控制区域
  - 移除"平抛运动仿真"按钮
  - 移除"牛顿定律仿真"按钮
  - 保留"重置"按钮
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-4.1: 检查 DOM 中是否不存在"平抛运动仿真"按钮
  - `programmatic` TR-4.2: 检查 DOM 中是否不存在"牛顿定律仿真"按钮
  - `programmatic` TR-4.3: 检查 DOM 中是否仍然存在"重置"按钮
- **Notes**: 不要移除相关的事件处理函数，只移除按钮和调用

## [x] Task 5: 验证重置功能正常工作
- **Priority**: P1
- **Depends On**: Task 4
- **Description**: 
  - 验证"重置"按钮点击后能够正常清空场景
  - 确保动画停止
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-5.1: 点击重置按钮后场景应被清空
  - `programmatic` TR-5.2: 点击重置按钮后所有动画回调应被清除
- **Notes**: 此功能已存在，只需验证
