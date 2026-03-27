import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import SimulationCanvas from '../components/SimulationCanvas';
import ChatPanel from '../components/ChatPanel';
import SolutionDisplay from '../components/SolutionDisplay';
import AnimationControls from '../components/AnimationControls';
import { executeCode } from '../components/CodeSandbox';
import projectileMotionCode from '../presets/projectileMotion';
import newtonSecondLawCode from '../presets/newtonSecondLaw';

function SimulationPage() {
  const {
    isReady,
    executionStatus,
    setExecutionStatus,
    setCodeReasoning,
    setGeneratedCode,
    resetScene,
    sceneRef,
    cameraRef,
    rendererRef,
    worldRef,
    animationCallbacksRef,
    currentCleanupRef,
    containerRef,
  } = useSimulation();

  const runPreset = (code, label) => {
    if (!isReady) {
      setExecutionStatus('3D 引擎未就绪');
      return;
    }
    setGeneratedCode(code);
    const result = executeCode(code, {
      sceneRef, cameraRef, rendererRef, worldRef,
      animationCallbacksRef, currentCleanupRef, containerRef,
    });
    setExecutionStatus(result.success ? '执行成功 ✓' : `执行失败: ${result.error}`);
    setCodeReasoning(label);
  };

  return (
    <div className="simulation-page">
      <header className="header">
        <h1>AI 交互科学仿真平台</h1>
        <p>基于多智能体与 RAG 的交互式高中物理教学系统</p>
      </header>

      <main className="main-content">
        <section className="simulation-area">
          <h2>物理仿真场景</h2>
          <SimulationCanvas />
          <AnimationControls />
          <div className="controls">
            <button className="ai-button" onClick={() => runPreset(projectileMotionCode, '平抛运动动画已启动')}>
              平抛运动示例
            </button>
            <button className="ai-button" onClick={() => runPreset(newtonSecondLawCode, '牛顿第二定律动画已启动')}>
              牛顿定律示例
            </button>
            <button className="ai-button" onClick={resetScene}>
              重置场景
            </button>
          </div>
          <SolutionDisplay />
        </section>

        <ChatPanel />
      </main>
    </div>
  );
}

export default SimulationPage;
