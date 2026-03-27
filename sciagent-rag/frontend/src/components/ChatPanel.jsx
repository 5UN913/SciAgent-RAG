import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { executeCode, extractCode } from './CodeSandbox';
import ImageUploader from './ImageUploader';

/**
 * ChatPanel — handles user input and the unified /api/solve flow.
 * Single submit triggers: RAG answer + simulation code generation.
 */
function ChatPanel() {
  const {
    message,
    setMessage,
    setResponse,
    setSolutionSteps,
    setPhysicsParams,
    setGeneratedCode,
    setCodeReasoning,
    setExecutionStatus,
    isLoading,
    setIsLoading,
    // Refs for code execution
    sceneRef,
    cameraRef,
    rendererRef,
    worldRef,
    animationCallbacksRef,
    currentCleanupRef,
    containerRef,
    isReady,
  } = useSimulation();

  const [useUnifiedApi, setUseUnifiedApi] = useState(true);

  // Unified solve: one click → answer + simulation
  const handleSolve = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setExecutionStatus('');
    setResponse('');
    setSolutionSteps([]);
    setPhysicsParams(null);
    setGeneratedCode('');
    setCodeReasoning('');

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message }),
      });

      if (!res.ok) {
        setResponse('Request failed, please try again');
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      // Set answer
      if (data.answer) {
        setResponse(data.answer);
      }

      // Set reasoning steps
      if (data.steps && data.steps.length > 0) {
        setSolutionSteps(data.steps);
      }

      // Set physics params
      if (data.params) {
        setPhysicsParams(data.params);
      }

      // Execute simulation code if provided
      if (data.simulation_code) {
        const cleanCode = extractCode(data.simulation_code);
        setGeneratedCode(cleanCode);
        setCodeReasoning(data.reasoning || '');

        if (isReady) {
          const result = executeCode(cleanCode, {
            sceneRef,
            cameraRef,
            rendererRef,
            worldRef,
            animationCallbacksRef,
            currentCleanupRef,
            containerRef,
          });

          setExecutionStatus(result.success ? '执行成功 ✓' : `执行失败: ${result.error}`);
        } else {
          setExecutionStatus('3D engine not ready');
        }
      }
    } catch (error) {
      setResponse('网络错误，请检查连接');
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: legacy separate endpoints
  const handleLegacyQuery = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.answer);
      } else {
        setResponse('获取回答失败，请稍后重试');
      }
    } catch (error) {
      setResponse('网络错误，请检查连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLegacyAnimate = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/code/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.code) {
          const cleanCode = extractCode(data.code);
          setGeneratedCode(cleanCode);
          setCodeReasoning(data.reasoning || '');

          if (isReady) {
            const result = executeCode(cleanCode, {
              sceneRef,
              cameraRef,
              rendererRef,
              worldRef,
              animationCallbacksRef,
              currentCleanupRef,
              containerRef,
            });
            setExecutionStatus(result.success ? '执行成功 ✓' : `执行失败: ${result.error}`);
          }
        } else {
          setExecutionStatus('代码生成失败');
        }
      }
    } catch (error) {
      setExecutionStatus('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = useUnifiedApi ? handleSolve : handleLegacyQuery;

  return (
    <section className="ai-area">
      <h2>AI 助手</h2>

      <div className="api-mode-toggle">
        <label>
          <input
            type="checkbox"
            checked={useUnifiedApi}
            onChange={(e) => setUseUnifiedApi(e.target.checked)}
          />
          {' '}统一求解模式（解答 + 仿真一体化）
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          className="ai-input"
          placeholder="输入物理题目...例如：一个小球从高度 h=20m 的桌面水平抛出，初速度 v0=5m/s"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="button-group">
          {useUnifiedApi ? (
            <button
              type="submit"
              className="ai-button"
              disabled={isLoading}
            >
              {isLoading ? '求解中...' : '一键求解'}
            </button>
          ) : (
            <>
              <button
                type="submit"
                className="ai-button"
                disabled={isLoading}
              >
                {isLoading ? '思考中...' : '获取解答'}
              </button>
              <button
                type="button"
                className="ai-button animation-button"
                onClick={handleLegacyAnimate}
                disabled={isLoading}
              >
                {isLoading ? '生成中...' : '生成动画'}
              </button>
            </>
          )}
        </div>
      </form>

      <ImageUploader />
    </section>
  );
}

export default ChatPanel;
