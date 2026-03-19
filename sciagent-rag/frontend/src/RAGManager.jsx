import React, { useState, useEffect } from 'react';
import DebugAPI from './DebugAPI';

function RAGManager() {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [docStats, setDocStats] = useState({ count: 0 });

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/rag/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('获取文档列表失败:', error);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('正在调用 /api/rag/stats...');
      const res = await fetch('/api/rag/stats');
      console.log('响应状态:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('响应数据:', data);
        setDocStats({ count: data.document_count });
      } else {
        console.error('请求失败，状态码:', res.status);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showMessage('请先选择文件', 'error');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/rag/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        showMessage(data.message, 'success');
        await fetchDocuments();
        setSelectedFile(null);
      } else {
        const error = await res.json();
        showMessage(error.detail || '上传失败', 'error');
      }
    } catch (error) {
      showMessage('网络错误，请检查连接', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (filename) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filename,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
      });

      const res = await fetch(`/api/rag/documents/process?${params}`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        showMessage(data.message, 'success');
        await fetchStats();
      } else {
        const error = await res.json();
        showMessage(error.detail || '处理失败', 'error');
      }
    } catch (error) {
      showMessage('网络错误，请检查连接', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`确定要删除文件 "${filename}" 吗？`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/rag/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showMessage('文件删除成功', 'success');
        await fetchDocuments();
      } else {
        const error = await res.json();
        showMessage(error.detail || '删除失败', 'error');
      }
    } catch (error) {
      showMessage('网络错误，请检查连接', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCollection = async () => {
    if (!confirm('确定要清空整个向量数据库吗？此操作不可恢复！')) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/rag/collection/clear', {
        method: 'DELETE',
      });

      if (res.ok) {
        showMessage('向量数据库已清空', 'success');
        await fetchStats();
      } else {
        const error = await res.json();
        showMessage(error.detail || '清空失败', 'error');
      }
    } catch (error) {
      showMessage('网络错误，请检查连接', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="rag-manager">
      <header className="header">
        <h1>RAG 知识库管理</h1>
        <p>管理文档上传、切片和向量数据库</p>
      </header>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <main className="main-content">
        <section className="stats-section">
          <h2>数据库统计</h2>
          <div className="stats-card">
            <div className="stat-item">
              <span className="stat-label">向量数据库文档块总数：</span>
              <span className="stat-value">{docStats.count}</span>
            </div>
            <button 
              className="ai-button danger"
              onClick={handleClearCollection}
              disabled={isLoading}
            >
              清空向量数据库
            </button>
          </div>
        </section>

        <section className="upload-section">
          <h2>上传文档</h2>
          <div className="upload-area">
            <input 
              type="file" 
              accept=".pdf,.txt,.md" 
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="upload-label">
              {selectedFile ? selectedFile.name : '点击选择文件'}
            </label>
            <button 
              className="ai-button"
              onClick={handleUpload}
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? '上传中...' : '上传'}
            </button>
          </div>
          <p className="hint">支持 PDF、TXT 和 Markdown 格式的文件</p>
        </section>

        <section className="settings-section">
          <h2>文档切片设置</h2>
          <div className="settings-group">
            <div className="setting-item">
              <label>块大小 (字符)：</label>
              <input 
                type="number" 
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                min="100"
                max="5000"
              />
            </div>
            <div className="setting-item">
              <label>重叠大小 (字符)：</label>
              <input 
                type="number" 
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                min="0"
                max="1000"
              />
            </div>
          </div>
          <p className="hint">块大小建议 500-2000，重叠建议为块大小的 10-20%</p>
        </section>

        <section className="documents-section">
          <h2>已上传的文档</h2>
          {documents.length === 0 ? (
            <p className="empty-message">暂无上传的文档</p>
          ) : (
            <div className="documents-list">
              {documents.map((doc, index) => (
                <div key={index} className="document-card">
                  <div className="document-info">
                    <h3>{doc.filename}</h3>
                    <p>大小: {formatFileSize(doc.size)}</p>
                    <p>上传时间: {formatDate(doc.created_time)}</p>
                  </div>
                  <div className="document-actions">
                    <button 
                      className="ai-button"
                      onClick={() => handleProcess(doc.filename)}
                      disabled={isLoading}
                    >
                      处理并添加到知识库
                    </button>
                    <button 
                      className="ai-button danger"
                      onClick={() => handleDelete(doc.filename)}
                      disabled={isLoading}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        <section className="debug-section">
          <h2>API 诊断工具</h2>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            用于检查 API 连接和数据返回
          </p>
          <DebugAPI />
        </section>
      </main>
    </div>
  );
}

export default RAGManager;
