# 修复代码生成响应解析问题 - 实施计划

## [ ] 任务 1: 创建智能代码提取函数
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建一个多层级的代码提取函数
  - 第一层：尝试解析 JSON
  - 第二层：尝试解析 Markdown 代码块
  - 第三层：清理代码并返回
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-4
- **Test Requirements**:
  - `programmatic` TR-1.1: 能从 JSON 字符串中提取 code 字段
  - `programmatic` TR-1.2: 能从 Markdown 代码块中提取代码
  - `human-judgement` TR-1.3: 控制台输出详细的解析日志
- **Notes**: 在 App.jsx 中实现这个函数

## [ ] 任务 2: 集成代码提取函数到生成流程
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在 generateAndExecuteCode 函数中使用新的代码提取函数
  - 确保代码在执行前经过正确的提取和清理
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgement` TR-2.1: 代码执行成功，显示"执行成功 ✓"
  - `programmatic` TR-2.2: executeAnimationCode 被正确调用

## [x] 任务 3: 测试完整流程
- **Priority**: P0
- **Depends On**: Task 1, Task 2
- **Description**: 
  - 测试完整的"生成动画"流程
  - 验证各种可能的响应格式都能正确处理
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `human-judgement` TR-3.1: 整个流程工作正常
  - `human-judgement` TR-3.2: 动画在 3D 场景中正常显示
