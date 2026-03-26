import React, { useState, useEffect } from 'react';
import LatexRenderer from './LatexRenderer';

function DebugAPI() {
  const [debugOutput, setDebugOutput] = useState([]);

  const addOutput = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugOutput(prev => [...prev, { timestamp, text, type }]);
  };

  const testAPIs = async () => {
    setDebugOutput([]);
    addOutput('开始测试 API...', 'info');

    try {
      addOutput('1. 测试 /api/rag/stats...', 'info');
      const statsRes = await fetch('/api/rag/stats');
      addOutput(`   状态码: ${statsRes.status}`, statsRes.ok ? 'success' : 'error');
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        addOutput(`   返回数据: ${JSON.stringify(statsData)}`, 'success');
        addOutput(`   文档块数量: ${statsData.document_count}`, 'success');
      }
    } catch (error) {
      addOutput(`   错误: ${error.message}`, 'error');
    }

    try {
      addOutput('2. 测试 /api/rag/documents...', 'info');
      const docsRes = await fetch('/api/rag/documents');
      addOutput(`   状态码: ${docsRes.status}`, docsRes.ok ? 'success' : 'error');
      
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        addOutput(`   返回文档数量: ${docsData.documents?.length || 0}`, 'success');
        docsData.documents?.forEach((doc, idx) => {
          addOutput(`   ${idx + 1}. ${doc.filename} (${(doc.size / 1024 / 1024).toFixed(2)} MB)`, 'info');
        });
      }
    } catch (error) {
      addOutput(`   错误: ${error.message}`, 'error');
    }

    try {
      addOutput('3. 直接测试后端 API (绕过代理)...', 'info');
      const directRes = await fetch('http://localhost:8001/rag/stats');
      addOutput(`   状态码: ${directRes.status}`, directRes.ok ? 'success' : 'error');
      
      if (directRes.ok) {
        const directData = await directRes.json();
        addOutput(`   返回数据: ${JSON.stringify(directData)}`, 'success');
      }
    } catch (error) {
      addOutput(`   错误: ${error.message}`, 'error');
    }

    addOutput('测试完成！', 'success');
  };

  useEffect(() => {
    testAPIs();
  }, []);

  const testLatexCases = [
    {
      name: '双美元块级公式',
      text: '这是一个块级公式示例：$$E = mc^2$$，公式后面的文字。'
    },
    {
      name: 'LaTeX 块级公式',
      text: '使用 LaTeX 块级公式：\\[\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\\]，继续阅读。'
    },
    {
      name: '单美元行内公式',
      text: '行内公式：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$，公式测试。'
    },
    {
      name: 'LaTeX 行内公式',
      text: '另一种行内公式：\\(\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\\)，同样有效。'
    },
    {
      name: '混合公式示例',
      text: '混合使用多种格式：$a^2 + b^2 = c^2$，然后块级：$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$'
    },
    {
      name: '复杂块级公式',
      text: '\\[\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\] 和 $\\det = ad - bc$'
    }
  ];

  return (
    <div>
      <div className="debug-api">
        <div className="debug-header">
          <h2>API 诊断工具</h2>
          <button className="ai-button" onClick={testAPIs}>重新测试</button>
        </div>
        <div className="debug-output">
          {debugOutput.map((item, idx) => (
            <div key={idx} className={`debug-line ${item.type}`}>
              <span className="timestamp">[{item.timestamp}]</span>
              <span className="text">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="debug-api latex-test">
        <div className="debug-header">
          <h2>LaTeX 渲染器测试</h2>
        </div>
        <div className="latex-test-output">
          {testLatexCases.map((testCase, idx) => (
            <div key={idx} className="test-case">
              <h3>测试 {idx + 1}: {testCase.name}</h3>
              <div className="test-input">
                <strong>输入:</strong> <code>{testCase.text}</code>
              </div>
              <div className="test-output">
                <strong>渲染结果:</strong>
                <div className="rendered-content">
                  <LatexRenderer text={testCase.text} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <style jsx>{`
          .debug-api {
            padding: 20px;
            background: #1e1e1e;
            border-radius: 8px;
            margin: 20px;
          }
          .debug-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .debug-header h2 {
            color: #fff;
            margin: 0;
          }
          .debug-output {
            font-family: 'Courier New', monospace;
            background: #0d0d0d;
            padding: 15px;
            border-radius: 4px;
            max-height: 500px;
            overflow-y: auto;
          }
          .debug-line {
            margin: 5px 0;
            padding: 5px;
          }
          .debug-line.success {
            color: #4ade80;
          }
          .debug-line.error {
            color: #f87171;
          }
          .debug-line.info {
            color: #60a5fa;
          }
          .timestamp {
            color: #888;
            margin-right: 10px;
          }
          .latex-test .latex-test-output {
            background: #0d0d0d;
            padding: 15px;
            border-radius: 4px;
          }
          .test-case {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #333;
          }
          .test-case:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .test-case h3 {
            color: #fff;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .test-input {
            margin-bottom: 10px;
            color: #ccc;
          }
          .test-input code {
            background: #2d2d2d;
            padding: 2px 6px;
            border-radius: 3px;
            color: #f0f0f0;
          }
          .test-output {
            color: #ccc;
          }
          .rendered-content {
            margin-top: 8px;
            padding: 15px;
            background: #252525;
            border-radius: 4px;
            color: #fff;
          }
        `}</style>
      </div>
    </div>
  );
}

export default DebugAPI;
