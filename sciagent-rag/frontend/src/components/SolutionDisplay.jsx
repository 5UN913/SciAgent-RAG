import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import LatexRenderer from '../LatexRenderer';

/**
 * SolutionDisplay — renders the AI answer, reasoning steps, physics params,
 * execution status, and generated code.
 */
function SolutionDisplay() {
  const {
    response,
    solutionSteps,
    physicsParams,
    executionStatus,
    codeReasoning,
    generatedCode,
  } = useSimulation();

  if (!response && !executionStatus && !generatedCode) {
    return null;
  }

  return (
    <div className="solution-display">
      {/* AI Answer */}
      {response && (
        <div className="ai-response">
          <h3>AI 回答：</h3>
          <LatexRenderer text={response} />
        </div>
      )}

      {/* Reasoning Steps */}
      {solutionSteps.length > 0 && (
        <div className="solution-steps">
          <h3>推理步骤：</h3>
          <ol>
            {solutionSteps.map((step, idx) => (
              <li key={idx}>
                <LatexRenderer text={step} />
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Physics Parameters */}
      {physicsParams && Object.keys(physicsParams).length > 0 && (
        <div className="physics-params">
          <h3>物理参数：</h3>
          <div className="params-grid">
            {Object.entries(physicsParams).map(([key, value]) => (
              <div key={key} className="param-chip">
                <span className="param-key">{key}</span>
                <span className="param-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Status */}
      {executionStatus && (
        <div className="execution-status">
          <h3>执行状态：</h3>
          <p className={executionStatus.includes('成功') ? 'success' : executionStatus.includes('失败') ? 'error' : ''}>
            {executionStatus}
          </p>
        </div>
      )}

      {/* Code Reasoning */}
      {codeReasoning && (
        <div className="ai-response">
          <h3>仿真推理：</h3>
          <pre>{codeReasoning}</pre>
        </div>
      )}

      {/* Generated Code */}
      {generatedCode && (
        <div className="code-display">
          <h3>生成的代码：</h3>
          <pre className="code-content">{generatedCode}</pre>
        </div>
      )}
    </div>
  );
}

export default SolutionDisplay;
