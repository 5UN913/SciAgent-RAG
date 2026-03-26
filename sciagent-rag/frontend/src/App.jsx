import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import Navigation from './Navigation';
import RAGManager from './RAGManager';
import LatexRenderer from './LatexRenderer';

/**
 * 智能代码提取函数 - 多层解析能力
 * @param {string} rawCode - 原始代码字符串
 * @returns {string} - 提取并清理后的代码
 */
const extractCodeSafely = (rawCode) => {
  console.log('========== 开始智能代码提取 ==========');
  console.log('原始输入:', rawCode);
  
  let extractedCode = rawCode;
  
  // 第0层: 清理前缀字符（如 "on " 等）
  console.log('步骤 0/4: 清理前缀字符');
  extractedCode = extractedCode.replace(/^\s*(on|ON)\s*/, '');
  console.log('清理前缀后:', extractedCode);
  
  // 第一层: 尝试解析 JSON
  console.log('步骤 1/4: 尝试解析 JSON');
  try {
    const parsed = JSON.parse(extractedCode);
    console.log('JSON 解析成功:', parsed);
    if (parsed.code) {
      extractedCode = parsed.code;
      console.log('从 JSON 中提取 code 字段:', extractedCode);
    } else {
      console.log('JSON 中没有 code 字段，尝试使用整个 JSON 字符串');
    }
  } catch (error) {
    console.log('JSON 解析失败，继续下一步:', error.message);
  }
  
  // 第二层: 尝试从 Markdown 代码块中提取
  console.log('步骤 2/4: 尝试从 Markdown 代码块中提取');
  const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/;
  const match = codeBlockRegex.exec(extractedCode);
  if (match) {
    extractedCode = match[1];
    console.log('从 Markdown 代码块中提取成功:', extractedCode);
  } else {
    console.log('没有找到 Markdown 代码块，继续下一步');
  }
  
  // 第三层: 再次尝试 JSON 解析（以防 code 字段中又有 JSON）
  console.log('步骤 3/4: 再次尝试 JSON 解析');
  try {
    const parsed = JSON.parse(extractedCode);
    console.log('二次 JSON 解析成功:', parsed);
    if (parsed.code) {
      extractedCode = parsed.code;
      console.log('从二次 JSON 中提取 code 字段:', extractedCode);
    }
  } catch (error) {
    console.log('二次 JSON 解析失败，继续:', error.message);
  }
  
  // 第四层: 清理代码
  console.log('步骤 4/4: 清理代码');
  extractedCode = extractedCode.trim();
  console.log('清理后的代码:', extractedCode);
  console.log('========== 智能代码提取完成 ==========');
  
  return extractedCode;
};

function SimulationPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAnimation, setIsGeneratingAnimation] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [codeResponse, setCodeResponse] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [executionStatus, setExecutionStatus] = useState('');
  const [rapierInitialized, setRapierInitialized] = useState(false);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const wsRef = useRef(null);
  const worldRef = useRef(null);
  const animationCallbacksRef = useRef([]);
  const currentCleanupRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  
  useEffect(() => {
    const initRapier = async () => {
      await RAPIER.init();
      setRapierInitialized(true);
    };
    initRapier();
  }, []);

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

          if (data.type === 'command_response' && data.data) {
            const cmd = data.data;
            if (cmd.code) {
              const extractedCode = extractCodeSafely(cmd.code);
              executeAnimationCode(extractedCode);
              setCodeResponse(cmd.reasoning || '代码已执行');
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

  const executeAnimationCode = (code) => {
    console.log('========== 开始执行动画代码 ==========');
    console.log('执行时间:', new Date().toISOString());
    console.log('代码内容:');
    console.log(code);
    console.log('=====================================');
    
    setGeneratedCode(code);
    setExecutionStatus('正在执行...');
    
    try {
      console.log('步骤 1/5: 清理旧场景');
      if (currentCleanupRef.current) {
        currentCleanupRef.current();
        currentCleanupRef.current = null;
        console.log('旧场景清理完成');
      } else {
        console.log('没有需要清理的旧场景');
      }

      console.log('步骤 2/5: 停止现有动画');
      animationCallbacksRef.current = [];
      console.log('现有动画已停止');

      console.log('步骤 3/5: 获取渲染环境');
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const world = worldRef.current;
      console.log('渲染环境获取完成:', {
        scene: !!scene,
        camera: !!camera,
        renderer: !!renderer,
        world: !!world
      });

      console.log('步骤 3.5/5: 增强代码清理逻辑');
      let cleanedCode = code;
      
      // 1. 清理危险操作
      console.log('  [清理 1/5] 清理危险操作');
      cleanedCode = cleanedCode.replace(/scene\.children\s*=\s*\[\]/g, '// scene.children = [] - 已禁用，防止清空地面');
      
      // 2. 检测 setupScene 函数
      console.log('  [清理 2/5] 检测 setupScene 函数');
      const setupSceneDefined = /function\s+setupScene\s*\(/.test(cleanedCode) || /const\s+setupScene\s*=/.test(cleanedCode) || /let\s+setupScene\s*=/.test(cleanedCode);
      const setupSceneCalled = /setupScene\s*\(\s*\)/.test(cleanedCode);
      
      console.log('    - setupScene 定义:', setupSceneDefined);
      console.log('    - setupScene 调用:', setupSceneCalled);
      
      // 3. 如果定义了但没调用，自动添加调用
      if (setupSceneDefined && !setupSceneCalled) {
        console.log('    [修复] setupScene 定义了但未调用，自动添加调用');
        cleanedCode = cleanedCode + '\n\n// 自动添加 setupScene() 调用\nsetupScene();';
      }
      
      // 4. 检测并注释掉重复创建地面的代码
      console.log('  [清理 3/5] 检测重复创建地面的代码');
      let groundCommentCount = 0;
      
      // 4.1 注释 THREE.BoxGeometry 创建的地面
      const boxGroundRegex = /(const\s+\w+\s*=\s*new\s+THREE\.BoxGeometry\([^)]*\)\s*;?\s*\/\/.*[Gg]round\b|const\s+\w+\s*=\s*new\s+THREE\.BoxGeometry\([^)]*\)\s*;?\s*\/\*.*[Gg]round\b|const\s+\w+\s*=\s*new\s+THREE\.BoxGeometry\([^)]*\)\s*;?\s*(?=.*[Gg]round\b)|const\s+\w+\s*=\s*new\s+THREE\.BoxGeometry\([^)]*\)\s*;?\s*(?=[^\n]*const\s+\w+\s*=\s*new\s+THREE\.Mesh)|\/\/\s*[Cc]reate\s+[Gg]round\s*-\s*box\s*geometry|\/\*\s*[Cc]reate\s+[Gg]round\s*-\s*box\s*geometry)/gi;
      
      const threeBoxLines = cleanedCode.split('\n').map(line => {
        if ((/new\s+THREE\.BoxGeometry/.test(line) && /ground|floor|floor|地面/i.test(line)) ||
            (/new\s+THREE\.BoxGeometry/.test(line) && /position\.y\s*=.*-/.test(cleanedCode.slice(cleanedCode.indexOf(line), cleanedCode.indexOf(line) + 500)))) {
          groundCommentCount++;
          console.log('    [注释] THREE.BoxGeometry 地面代码:', line.trim());
          return '// ' + line + ' // 已注释 - 避免重复创建地面';
        }
        return line;
      });
      
      cleanedCode = threeBoxLines.join('\n');
      
      // 4.2 注释 RAPIER 刚体创建的地面
      const rapierLines = cleanedCode.split('\n').map(line => {
        if ((/RAPIER\.RigidBodyDesc|RAPIER\.ColliderDesc/.test(line) && /ground|floor|地面/i.test(line)) ||
            (/RAPIER\.RigidBodyDesc|RAPIER\.ColliderDesc/.test(line) && /fixed|Static/.test(line))) {
          // 检查附近是否有地面相关代码
          const context = cleanedCode.slice(Math.max(0, cleanedCode.indexOf(line) - 200), cleanedCode.indexOf(line) + 200);
          if (/ground|floor|地面/i.test(context)) {
            groundCommentCount++;
            console.log('    [注释] RAPIER 刚体地面代码:', line.trim());
            return '// ' + line + ' // 已注释 - 避免重复创建地面';
          }
        }
        return line;
      });
      
      cleanedCode = rapierLines.join('\n');
      
      console.log('    - 共注释了', groundCommentCount, '行地面创建代码');
      
      // 5. 清理注释后可能的多余空行
      console.log('  [清理 4/5] 清理多余空行');
      cleanedCode = cleanedCode.replace(/\n{3,}/g, '\n\n');
      
      console.log('  [清理 5/5] 代码清理完成');
      console.log('清理后的代码:');
      console.log(cleanedCode);

      console.log('步骤 4/5: 准备沙箱环境');
      const animate = (callback) => {
        animationCallbacksRef.current.push(callback);
      };

      const stopAnimation = () => {
        animationCallbacksRef.current = [];
      };

      const sandbox = {
        THREE,
        RAPIER,
        scene,
        camera,
        renderer,
        world,
        animate,
        stopAnimation
      };
      console.log('沙箱环境准备完成，沙箱变量:', Object.keys(sandbox));

      console.log('步骤 5/5: 执行代码');
      const executeCode = new Function(...Object.keys(sandbox), cleanedCode);
      const result = executeCode(...Object.values(sandbox));
      console.log('代码执行成功');

      setExecutionStatus('执行成功 ✓');
      console.log('========== 动画代码执行完成 ==========');
      
    } catch (error) {
      console.error('========== 动画代码执行错误 ==========');
      console.error('错误时间:', new Date().toISOString());
      console.error('错误类型:', error.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      console.error('=====================================');
      
      setExecutionStatus('执行失败 ✗');
      setCodeResponse(`代码执行错误: ${error.name}: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !rapierInitialized) return;

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
    ground.userData.isGround = true;
    scene.add(ground);

    const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
    worldRef.current = world;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (world) {
        world.step();
      }

      animationCallbacksRef.current.forEach(callback => {
        try {
          callback(deltaTime);
        } catch (error) {
          console.error('动画回调错误:', error);
        }
      });

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
      animationCallbacksRef.current = [];
    };
  }, [rapierInitialized]);

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

  const handleGenerateAnimation = async () => {
    if (!message.trim()) return;

    setIsGeneratingAnimation(true);
    try {
      await generateAndExecuteCode(message);
    } finally {
      setIsGeneratingAnimation(false);
    }
  };

  const generateAndExecuteCode = async (question) => {
    console.log('开始生成代码，问题:', question);
    try {
      const codeRes = await fetch('/api/code/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });
      
      if (codeRes.ok) {
        const codeData = await codeRes.json();
        console.log('代码生成响应:', codeData);
        if (codeData.status === 'success' && codeData.code) {
          const extractedCode = extractCodeSafely(codeData.code);
          setCodeResponse(codeData.reasoning || '代码已执行');
          executeAnimationCode(extractedCode);
        } else {
          console.error('代码生成失败:', codeData);
          setExecutionStatus('代码生成失败');
        }
      } else {
        console.error('代码生成请求失败，状态码:', codeRes.status);
        setExecutionStatus('代码生成请求失败');
      }
    } catch (error) {
      console.error('生成代码时出错:', error);
      setExecutionStatus('网络错误');
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
      setCodeResponse('WebSocket 连接未建立');
    }
  };

  const handleProjectileMotion = () => {
    const code = `// 平抛运动实验
const objects = [];
const trails = [];

function setupScene() {
  // 创建桌面
  const tableGeometry = new THREE.BoxGeometry(2, 0.2, 1);
  const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.set(-3, 2, 0);
  scene.add(table);
  objects.push(table);
  
  // 创建桌腿
  const legGeometry = new THREE.BoxGeometry(0.1, 4, 0.1);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
  const leg1 = new THREE.Mesh(legGeometry, legMaterial);
  leg1.position.set(-3.8, 0, -0.4);
  scene.add(leg1);
  objects.push(leg1);
  const leg2 = new THREE.Mesh(legGeometry, legMaterial);
  leg2.position.set(-2.2, 0, -0.4);
  scene.add(leg2);
  objects.push(leg2);
  const leg3 = new THREE.Mesh(legGeometry, legMaterial);
  leg3.position.set(-3.8, 0, 0.4);
  scene.add(leg3);
  objects.push(leg3);
  const leg4 = new THREE.Mesh(legGeometry, legMaterial);
  leg4.position.set(-2.2, 0, 0.4);
  scene.add(leg4);
  objects.push(leg4);
  
  // 创建小球
  const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(-2, 2.2, 0);
  ball.userData = { startTime: Date.now(), initialX: -2, initialY: 2.2, v0: 5, g: 10 };
  scene.add(ball);
  objects.push(ball);
}

function update(deltaTime) {
  const ball = objects.find(obj => obj.geometry && obj.geometry.type === 'SphereGeometry');
  if (ball && ball.userData) {
    const elapsed = (Date.now() - ball.userData.startTime) / 1000;
    const x = ball.userData.initialX + ball.userData.v0 * elapsed;
    const y = ball.userData.initialY - 0.5 * ball.userData.g * elapsed * elapsed;
    
    if (y >= -2) {
      ball.position.set(x, y, 0);
      
      // 添加轨迹
      const trailGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const trailMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6 });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.copy(ball.position);
      scene.add(trail);
      trails.push(trail);
      
      if (trails.length > 100) {
        const oldTrail = trails.shift();
        scene.remove(oldTrail);
      }
    } else {
      ball.position.y = -1.8;
    }
  }
}

function cleanup() {
  objects.forEach(obj => scene.remove(obj));
  trails.forEach(trail => scene.remove(trail));
  objects.length = 0;
  trails.length = 0;
}

setupScene();
animate(update);`;
    executeAnimationCode(code);
    setCodeResponse('平抛运动动画已启动');
  };

  const handleNewtonLaw = () => {
    const code = `// 牛顿第二定律实验
const objects = [];

function setupScene() {
  // 创建地面
  const groundGeometry = new THREE.BoxGeometry(10, 0.5, 4);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x88aa88 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.set(0, -2.25, 0);
  scene.add(ground);
  objects.push(ground);
  
  // 创建滑块
  const boxGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.6);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(-4, -1.75, 0);
  box.userData = { velocity: 0, mass: 0.1, force: 0.5 };
  scene.add(box);
  objects.push(box);
}

function update(deltaTime) {
  const box = objects.find(obj => obj.userData && obj.userData.mass);
  if (box && box.userData) {
    const a = box.userData.force / box.userData.mass;
    box.userData.velocity += a * deltaTime;
    box.position.x += box.userData.velocity * deltaTime;
    
    if (box.position.x > 5) {
      box.position.x = -4;
      box.userData.velocity = 0;
    }
  }
}

function cleanup() {
  objects.forEach(obj => scene.remove(obj));
  objects.length = 0;
}

setupScene();
animate(update);`;
    executeAnimationCode(code);
    setCodeResponse('牛顿第二定律动画已启动');
  };

  const handleReset = () => {
    console.log('========== 开始重置场景 ==========');
    
    animationCallbacksRef.current = [];
    
    const scene = sceneRef.current;
    if (scene) {
      console.log('清理场景中的所有对象...');
      
      const objectsToRemove = [];
      scene.traverse((object) => {
        if (object.isMesh && !object.userData.isGround) {
          objectsToRemove.push(object);
        }
      });
      
      objectsToRemove.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      
      console.log(`已清理 ${objectsToRemove.length} 个对象`);
    }
    
    currentCleanupRef.current = null;
    setCodeResponse('场景已重置');
    setExecutionStatus('');
    console.log('========== 场景重置完成 ==========');
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
            <button className="ai-button" onClick={handleProjectileMotion}>平抛运动示例</button>
            <button className="ai-button" onClick={handleNewtonLaw}>牛顿定律示例</button>
            <button className="ai-button" onClick={handleReset}>重置场景</button>
          </div>
          
          {executionStatus && (
            <div className="execution-status">
              <h3>执行状态：</h3>
              <p className={executionStatus.includes('成功') ? 'success' : executionStatus.includes('失败') ? 'error' : ''}>
                {executionStatus}
              </p>
            </div>
          )}
          
          {codeResponse && (
            <div className="ai-response">
              <h3>代码执行信息（Reasoning）：</h3>
              <pre>{codeResponse}</pre>
            </div>
          )}
          
          {generatedCode && (
            <div className="code-display">
              <h3>生成的原始代码：</h3>
              <pre className="code-content">{generatedCode}</pre>
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
            <div className="button-group">
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
                onClick={handleGenerateAnimation}
                disabled={isGeneratingAnimation}
              >
                {isGeneratingAnimation ? '生成中...' : '生成动画'}
              </button>
            </div>
          </form>
          {response && (
            <div className="ai-response">
              <h3>AI 回答：</h3>
              <LatexRenderer text={response} />
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
