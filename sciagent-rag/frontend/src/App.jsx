import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

function App() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [commandResponse, setCommandResponse] = useState('');
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const cubeRef = useRef(null);
  const animationIdRef = useRef(null);
  const wsRef = useRef(null);

  // 初始化 WebSocket 连接
  useEffect(() => {
    // 创建 WebSocket 连接
    wsRef.current = new WebSocket('ws://localhost:8000/ws/simulation');
    
    wsRef.current.onopen = () => {
      console.log('WebSocket 连接已建立');
      setWsConnected(true);
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('收到 WebSocket 消息:', data);
        
        if (data.type === 'command_response') {
          setCommandResponse(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.error('解析 WebSocket 消息失败:', error);
      }
    };
    
    wsRef.current.onclose = () => {
      console.log('WebSocket 连接已关闭');
      setWsConnected(false);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
    
    // 心跳检测
    const heartbeatInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    // 清理函数
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(heartbeatInterval);
    };
  }, []);

  // 初始化 Three.js 场景
  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 创建光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    // 创建滑块（立方体）
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x007bff });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(-3, -1.5, 0);
    scene.add(cube);
    cubeRef.current = cube;

    // 动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // 简单的动画：让立方体左右移动
      cube.position.x = Math.sin(Date.now() * 0.001) * 2 - 3;
      
      renderer.render(scene, camera);
    };

    animate();

    // 清理函数
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (canvasRef.current && canvasRef.current.firstChild) {
        canvasRef.current.removeChild(canvasRef.current.firstChild);
      }
    };
  }, []);

  // 处理 AI 提问
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // 处理文件上传
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage(data.text);
      } else {
        setResponse('OCR 识别失败，请稍后重试');
      }
    } catch (error) {
      setResponse('网络错误，请检查连接');
    }
  };

  // 发送命令到后端
  const sendCommand = (command) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'command',
        data: command
      }));
    } else {
      setCommandResponse('WebSocket 连接未建立');
    }
  };

  // 处理仿真控制按钮点击
  const handleSimulationStart = () => {
    const command = {
      command: 'start_simulation',
      target: 'newton_second_law',
      parameters: {
        mass: 0.1,
        force: 0.5
      },
      reasoning: '开始牛顿第二定律实验，设置滑块质量为 0.1kg，施加 0.5N 的力'
    };
    sendCommand(command);
  };

  const handleSimulationPause = () => {
    const command = {
      command: 'pause_simulation',
      target: 'newton_second_law',
      reasoning: '暂停仿真'
    };
    sendCommand(command);
  };

  const handleSimulationReset = () => {
    const command = {
      command: 'reset_simulation',
      target: 'newton_second_law',
      reasoning: '重置仿真到初始状态'
    };
    sendCommand(command);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>AI 交互科学仿真平台</h1>
        <p>基于多智能体与 RAG 的交互式高中物理/化学教学系统</p>
        <p>WebSocket 连接状态: {wsConnected ? '已连接' : '未连接'}</p>
      </header>

      <main className="main-content">
        <section className="simulation-area">
          <h2>物理仿真场景</h2>
          <div 
            ref={canvasRef} 
            className="simulation-canvas"
          ></div>
          <div className="controls">
            <button className="ai-button" onClick={handleSimulationStart}>开始仿真</button>
            <button className="ai-button" onClick={handleSimulationPause}>暂停</button>
            <button className="ai-button" onClick={handleSimulationReset}>重置</button>
          </div>
          {commandResponse && (
            <div className="ai-response">
              <h3>命令响应：</h3>
              <pre>{commandResponse}</pre>
            </div>
          )}
        </section>

        <section className="ai-area">
          <h2>AI 助手</h2>
          <form onSubmit={handleSubmit}>
            <textarea
              className="ai-input"
              placeholder="输入你的问题..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <button 
              type="submit" 
              className="ai-button"
              disabled={isLoading}
            >
              {isLoading ? '思考中...' : '发送'}
            </button>
          </form>
          {response && (
            <div className="ai-response">
              <h3>AI 回答：</h3>
              <p>{response}</p>
            </div>
          )}
          <div className="upload-area">
            <p>上传实验截图或手写草稿</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">点击上传</label>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
