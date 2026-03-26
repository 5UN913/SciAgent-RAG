# 修复代码生成响应解析问题 - 产品需求文档

## Overview
- **Summary**: 修复点击"生成动画"按钮时，生成的代码响应被错误解析的问题，确保代码能够正确提取和执行。
- **Purpose**: 解决当后端返回包含 JSON 包裹的代码时，前端无法正确提取和执行代码的问题，导致 SyntaxError: Unexpected token ':' 错误。
- **Target Users**: 使用 AI 交互科学仿真平台的用户，特别是需要通过自然语言生成动画的师生。

## Goals
- 修复代码生成响应的解析逻辑
- 确保无论后端返回什么格式的响应，都能正确提取 JavaScript 代码
- 提高代码提取的健壮性和容错能力

## Non-Goals (Out of Scope)
- 不修改后端代码生成逻辑
- 不修改 AI 模型的输出格式

## Background & Context
当前问题：
1. 后端返回的响应中，`code` 字段包含一个完整的 JSON 对象字符串
2. 前端直接将这个 JSON 字符串作为代码执行，导致语法错误
3. 需要在前端添加更强的响应解析逻辑

## Functional Requirements
- **FR-1**: 前端应能正确解析 API 响应中的代码，即使代码被包裹在 JSON 对象中
- **FR-2**: 代码提取逻辑应具有多层容错机制
- **FR-3**: 应提供详细的调试日志，帮助排查解析问题

## Non-Functional Requirements
- **NFR-1**: 代码提取应在 100ms 内完成
- **NFR-2**: 错误提示应清晰易懂
- **NFR-3**: 应兼容多种可能的响应格式

## Constraints
- **Technical**: 必须使用现有的前端架构
- **Dependencies**: 依赖后端返回的 API 响应

## Assumptions
- 后端可能返回多种格式的代码响应
- 代码可能被包裹在 JSON 对象中
- 代码可能被包裹在 Markdown 代码块中

## Acceptance Criteria

### AC-1: 能正确解析 JSON 包裹的代码
- **Given**: API 响应中的 code 字段包含一个 JSON 字符串
- **When**: 前端收到响应并尝试提取代码
- **Then**: 能正确从 JSON 字符串中提取 code 字段的内容
- **Verification**: `programmatic`

### AC-2: 能正确解析 Markdown 代码块
- **Given**: API 响应中的 code 字段包含 Markdown 代码块
- **When**: 前端收到响应并尝试提取代码
- **Then**: 能正确从代码块中提取 JavaScript 代码
- **Verification**: `programmatic`

### AC-3: 代码能正常执行
- **Given**: 代码已正确提取
- **When**: 调用 executeAnimationCode 执行代码
- **Then**: 代码执行成功，显示"执行成功 ✓"
- **Verification**: `human-judgment`

### AC-4: 提供详细的调试日志
- **Given**: 代码解析过程中
- **When**: 每一步解析操作
- **Then**: 控制台输出详细的调试信息
- **Verification**: `human-judgment`

## Open Questions
- 无
