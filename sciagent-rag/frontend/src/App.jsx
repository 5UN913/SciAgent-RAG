import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import * as THREE from 'three';
import Navigation from './Navigation';
import RAGManager from './RAGManager';

function SimulationPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [commandResponse, setCommandResponse] = useState('');
  const [animationState, setAnimationState] = useState('idle');
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const commandAnimationRef = useRef({mode: 'idle', startTime: 0, duration: 0});
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const projectileRef = useRef(null);
  const animationIdRef = useRef(null);
  const wsRef = useRef(null);
  const projectilesRef = useRef([]);
  
  const [simulationParams, setSimulationParams] = useState({
    h: 2,
    v0: 5,
    g: 10,
    timeScale: 1
  });

  useEffect(() => {
    const connectWebSocket = () => {
      wsRef.current = new WebSocket('ws://localhost:8001/ws/simulation');
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
            const cmd = data.data;
            if (cmd && cmd.command === 'start_simulation') {
              const target = cmd.target;
              const params = cmd.parameters || {};
              if (target === 'projectile_motion' || target === '平抛运动') {
                const h = params.h || 2;
                const v0 = params.v0 || 5;
                const g = params.g || 10;
                const duration = Math.sqrt(2 * h / g) + 1;
                commandAnimationRef.current = { 
                  mode: 'projectile', 
                  startTime: Date.now(), 
                  duration: duration * 1000,
                  parameters: { h, v0, g }
                };
                setAnimationState('projectile');
              } else {
                commandAnimationRef.current = { mode: 'running', startTime: Date.now(), duration: 0 };
                setAnimationState('running');
              }
            } else if (cmd && cmd.command === 'pause_simulation') {
              commandAnimationRef.current = { mode: 'paused', startTime: Date.now(), duration: 0 };
              setAnimationState('paused');
            } else if (cmd && cmd.command === 'reset_simulation') {
              commandAnimationRef.current = { mode: 'reset', startTime: Date.now(), duration: 0 };
              setAnimationState('reset');
            } else if (cmd && cmd.command === 'play_animation') {
              const duration = cmd.parameters?.duration || 2;
              commandAnimationRef.current = { mode: 'play_animation', startTime: Date.now(), duration: duration * 1000, animation: cmd.parameters?.animation || 'slide' };
              setAnimationState('play_animation');
            }
          }
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket 连接已关闭，5秒后重连');
        setWsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        setWsConnected(false);
      };
    };

    connectWebSocket();

    const heartbeatInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(heartbeatInterval);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(3, 5, 2);
    scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(30, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x88aa88 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    const tableGeometry = new THREE.BoxGeometry(2, 0.2, 1);
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(-8, 0, 0);
    scene.add(table);

    const tableLegGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);
    const tableLegMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const leg1 = new THREE.Mesh(tableLegGeometry, tableLegMaterial);
    leg1.position.set(-8.8, -1, -0.4);
    scene.add(leg1);
    const leg2 = new THREE.Mesh(tableLegGeometry, tableLegMaterial);
    leg2.position.set(-7.2, -1, -0.4);
    scene.add(leg2);
    const leg3 = new THREE.Mesh(tableLegGeometry, tableLegMaterial);
    leg3.position.set(-8.8, -1, 0.4);
    scene.add(leg3);
    const leg4 = new THREE.Mesh(tableLegGeometry, tableLegMaterial);
    leg4.position.set(-7.2, -1, 0.4);
    scene.add(leg4);

    const projectileGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const projectileMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.position.set(-7, 0.2, 0);
    scene.add(projectile);
    projectileRef.current = projectile;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const now = Date.now();
      const state = commandAnimationRef.current;

      if (state.mode === 'projectile') {
        const elapsed = ((now - state.startTime) / 1000) * simulationParams.timeScale;
        const params = state.parameters || { v0: simulationParams.v0, h: simulationParams.h, g: simulationParams.g };
        
        const x = params.v0 * elapsed;
        const y = params.h - 0.5 * params.g * elapsed * elapsed;
        
        if (y >= -2) {
          projectileRef.current.position.set(-7 + x, 0.2 + y, 0);
          
          const trailGeometry = new THREE.SphereGeometry(0.05, 8, 8);
          const trailMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6 });
          const trail = new THREE.Mesh(trailGeometry, trailMaterial);
          trail.position.copy(projectileRef.current.position);
          scene.add(trail);
          projectilesRef.current.push(trail);
          
          if (projectilesRef.current.length > 100) {
            const oldTrail = projectilesRef.current.shift();
            scene.remove(oldTrail);
          }
        } else {
          projectileRef.current.position.y = -1.8;
          if (elapsed > (state.duration / 1000 * simulationParams.timeScale)) {
            commandAnimationRef.current.mode = 'idle';
          }
        }
      } else if (state.mode === 'reset') {
        projectileRef.current.position.set(-7, 0.2, 0);
        projectilesRef.current.forEach(trail => scene.remove(trail));
        projectilesRef.current.length = 0;
        commandAnimationRef.current.mode = 'idle';
      } else if (state.mode === 'running') {
        projectileRef.current.position.x += 0.02;
        if (projectileRef.current.position.x > 10) projectileRef.current.position.x = -7;
      } else if (state.mode === 'play_animation') {
        const elapsed = (now - state.startTime) * simulationParams.timeScale;
        const t = Math.min(elapsed / state.duration, 1);
        if (state.animation === 'slide') {
          projectileRef.current.position.x = -7 + 14 * t;
        } else if (state.animation === 'bounce') {
          projectileRef.current.position.y = -1.5 + Math.abs(Math.sin(t * Math.PI * 4)) * 1.2;
        }
        if (elapsed >= state.duration) {
          commandAnimationRef.current.mode = 'idle';
        }
      }

      renderer.render(scene, camera);
    };

    animate();

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
        
        await generateAndExecuteSimulation(message);
      } else {
        setResponse('获取回答失败，请稍后重试');
      }
    } catch (error) {
      setResponse('网络错误，请检查连接');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndExecuteSimulation = async (question) => {
    try {
      const commandRes = await fetch('/api/command/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });
      
      if (commandRes.ok) {
        const commandData = await commandRes.json();
        if (commandData.status === 'success' && commandData.command) {
          sendCommand(commandData.command);
        }
      }
    } catch (error) {
      console.error('生成仿真命令失败:', error);
    }
  };

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

  const handleSimulationStart = () => {
    const command = {
      command: 'start_simulation',
      target: 'projectile_motion',
      parameters: {
        h: simulationParams.h,
        v0: simulationParams.v0,
        g: simulationParams.g
      },
      reasoning: `开始平抛运动仿真，设置初始高度 ${simulationParams.h}m，初速度 ${simulationParams.v0}m/s，重力加速度 ${simulationParams.g}m/s²`
    };
    sendCommand(command);
  };

  const handleParamChange = (key, value) => {
    setSimulationParams(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
  };

  const handleNewtonStart = () => {
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

  const handlePlayAnimation = () => {
    const command = {
      command: 'play_animation',
      target: 'slider',
      parameters: {
        animation: 'slide',
        duration: 2
      },
      reasoning: '播放滑块滑动动画'
    };
    sendCommand(command);
  };

  return (
    <div className="simulation-page">
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
            <button className="ai-button" onClick={handleSimulationStart}>平抛运动仿真</button>
            <button className="ai-button" onClick={handleNewtonStart}>牛顿定律仿真</button>
            <button className="ai-button" onClick={handleSimulationPause}>暂停</button>
            <button className="ai-button" onClick={handleSimulationReset}>重置</button>
          </div>
          
          <div className="params-panel">
            <h3>仿真参数</h3>
            <div className="param-item">
              <label>初始高度 h (m):</label>
              <input 
                type="number" 
                step="0.1" 
                min="0.5" 
                max="10" 
                value={simulationParams.h}
                onChange={(e) => handleParamChange('h', e.target.value)}
              />
            </div>
            <div className="param-item">
              <label>初速度 v₀ (m/s):</label>
              <input 
                type="number" 
                step="0.5" 
                min="1" 
                max="20" 
                value={simulationParams.v0}
                onChange={(e) => handleParamChange('v0', e.target.value)}
              />
            </div>
            <div className="param-item">
              <label>重力加速度 g (m/s²):</label>
              <input 
                type="number" 
                step="0.5" 
                min="1" 
                max="20" 
                value={simulationParams.g}
                onChange={(e) => handleParamChange('g', e.target.value)}
              />
            </div>
            <div className="param-item">
              <label>时间速度:</label>
              <input 
                type="number" 
                step="0.1" 
                min="0.1" 
                max="5" 
                value={simulationParams.timeScale}
                onChange={(e) => handleParamChange('timeScale', e.target.value)}
              />
            </div>
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

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<SimulationPage />} />
          <Route path="/rag-manager" element={<RAGManager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
