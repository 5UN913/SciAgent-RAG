import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { useSimulation } from '../context/SimulationContext';

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
  } = useSimulation();

  const isPlayingRef = useRef(true);
  const speedRef = useRef(1);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    speedRef.current = speed;
  }, [isPlaying, speed]);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      await initRapierOnce();
      if (disposed) return;

      const container = containerRef.current;
      if (!container) return;

      // Prevent double-init from StrictMode remount if already set up
      if (initDoneRef.current && sceneRef.current && rendererRef.current) {
        // Re-attach renderer to container if it was removed during cleanup
        if (!container.firstChild && rendererRef.current.domElement) {
          container.appendChild(rendererRef.current.domElement);
        }
        startRenderLoop();
        return;
      }

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      sceneRef.current = scene;

      // OrthographicCamera — flat 2D view on XY plane
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

      // Flat lighting — no shadows
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambientLight);

      // Ground line at y=0
      const groundLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-100, 0, 0),
        new THREE.Vector3(100, 0, 0),
      ]);
      const groundLineMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
      const groundLine = new THREE.Line(groundLineGeometry, groundLineMaterial);
      groundLine.userData.isGround = true;
      scene.add(groundLine);

      // Grid lines for spatial reference
      const gridLineMaterial = new THREE.LineBasicMaterial({ color: 0xe0e0e0 });

      // Vertical grid lines every 5 units
      for (let x = -100; x <= 100; x += 5) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -100, 0),
          new THREE.Vector3(x, 100, 0),
        ]);
        const line = new THREE.Line(geometry, gridLineMaterial);
        line.userData.isGround = true;
        scene.add(line);
      }

      // Horizontal grid lines every 5 units
      for (let y = -100; y <= 100; y += 5) {
        if (y === 0) continue; // skip y=0 — already drawn as ground line
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

      const handleResize = () => {
        if (!container || disposed) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        const newAspect = w / h;
        camera.left = -viewSize * newAspect / 2;
        camera.right = viewSize * newAspect / 2;
        camera.top = viewSize / 2;
        camera.bottom = -viewSize / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);
      container._resizeCleanup = () => window.removeEventListener('resize', handleResize);

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
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="simulation-canvas"
    />
  );
}

export default SimulationCanvas;
