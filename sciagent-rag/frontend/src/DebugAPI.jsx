import React, { useState, useEffect } from 'react';

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

  return (
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
      `}</style>
    </div>
  );
}

export default DebugAPI;
