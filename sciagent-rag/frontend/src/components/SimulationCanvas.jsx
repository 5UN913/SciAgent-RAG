import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { useSimulation, CANVAS_SIZES } from '../context/SimulationContext';

let rapierReady = false;
let rapierInitPromise = null;

function initRapierOnce() {
  if (rapierReady) return Promise.resolve();
  if (!rapierInitPromise) {
    rapierInitPromise = RAPIER.init().then(() => {
      rapierReady = true;
    });
  }
  return rapierInitPromise;
}

function SimulationCanvas() {
  const animationIdRef = useRef(null);
  const controlsRef = useRef(null);
  const initDoneRef = useRef(false);
  const resizeObserverRef = useRef(null);

  const {
    sceneRef,
    cameraRef,
    rendererRef,
    worldRef,
    animationCallbacksRef,
    lastTimeRef,
    containerRef,
    setIsReady,
    isPlaying,
    speed,
    updateElapsedTime,
    canvasSize,
    isFullscreen,
    setIsFullscreen,
  } = useSimulation();

  const isPlayingRef = useRef(true);
  const speedRef = useRef(1);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    speedRef.current = speed;
  }, [isPlaying, speed]);

  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!container || !camera || !renderer) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    const viewSize = 20;
    const newAspect = w / h;
    camera.left = -viewSize * newAspect / 2;
    camera.right = viewSize * newAspect / 2;
    camera.top = viewSize / 2;
    camera.bottom = -viewSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, [containerRef, cameraRef, rendererRef]);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      await initRapierOnce();
      if (disposed) return;

      const container = containerRef.current;
      if (!container) return;

      if (initDoneRef.current && sceneRef.current && rendererRef.current) {
        if (!container.firstChild && rendererRef.current.domElement) {
          container.appendChild(rendererRef.current.domElement);
        }
        startRenderLoop();
        return;
      }

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      sceneRef.current = scene;

      const viewSize = 20;
      const aspect = container.clientWidth / container.clientHeight;
      const camera = new THREE.OrthographicCamera(
        -viewSize * aspect / 2,
        viewSize * aspect / 2,
        viewSize / 2,
        -viewSize / 2,
        0.1,
        1000
      );
      camera.position.set(0, 5, 50);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableRotate = false;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.minZoom = 0.5;
      controls.maxZoom = 5;
      controls.target.set(0, 0, 0);
      controls.update();
      controlsRef.current = controls;

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambientLight);

      const groundLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-100, 0, 0),
        new THREE.Vector3(100, 0, 0),
      ]);
      const groundLineMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
      const groundLine = new THREE.Line(groundLineGeometry, groundLineMaterial);
      groundLine.userData.isGround = true;
      scene.add(groundLine);

      const gridLineMaterial = new THREE.LineBasicMaterial({ color: 0xe0e0e0 });

      for (let x = -100; x <= 100; x += 5) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -100, 0),
          new THREE.Vector3(x, 100, 0),
        ]);
        const line = new THREE.Line(geometry, gridLineMaterial);
        line.userData.isGround = true;
        scene.add(line);
      }

      for (let y = -100; y <= 100; y += 5) {
        if (y === 0) continue;
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-100, y, 0),
          new THREE.Vector3(100, y, 0),
        ]);
        const line = new THREE.Line(geometry, gridLineMaterial);
        line.userData.isGround = true;
        scene.add(line);
      }

      const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
      worldRef.current = world;

      initDoneRef.current = true;

      window.addEventListener('resize', handleResize);
      startRenderLoop();
      setIsReady(true);
    };

    function startRenderLoop() {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const controls = controlsRef.current;
      const world = worldRef.current;

      if (!scene || !camera || !renderer) return;

      const tick = () => {
        if (disposed) return;
        animationIdRef.current = requestAnimationFrame(tick);

        const now = Date.now();
        const rawDelta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        const playing = isPlayingRef.current;
        const spd = speedRef.current;
        const adjustedDelta = playing ? rawDelta * spd : 0;

        if (playing && world) {
          try { world.step(); } catch { /* world may be disposed */ }
        }

        animationCallbacksRef.current.forEach((callback) => {
          try {
            callback(adjustedDelta);
          } catch (err) {
            console.error('Animation callback error:', err);
          }
        });

        if (adjustedDelta > 0) {
          updateElapsedTime(adjustedDelta);
        }

        if (controls) controls.update();
        renderer.render(scene, camera);
      };

      tick();
    }

    init();

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ResizeObserver for container size changes (canvas size toggle, fullscreen)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserverRef.current.observe(container);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [handleResize]);

  // Fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(!!fsEl);
      setTimeout(handleResize, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [setIsFullscreen, handleResize]);

  // Resize renderer when canvasSize or isFullscreen changes
  useEffect(() => {
    const timer1 = setTimeout(handleResize, 50);
    const timer2 = setTimeout(handleResize, 350);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [canvasSize, isFullscreen, handleResize]);

  const canvasHeight = CANVAS_SIZES[canvasSize] || 400;

  return (
    <div
      ref={containerRef}
      className={`simulation-canvas ${canvasSize}`}
      style={isFullscreen ? { height: '100%' } : { height: `${canvasHeight}px` }}
    />
  );
}

export default SimulationCanvas;