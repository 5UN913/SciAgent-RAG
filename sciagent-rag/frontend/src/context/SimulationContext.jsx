import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const SimulationContext = createContext(null);

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return ctx;
}

export function SimulationProvider({ children }) {
  // Three.js refs — owned by SimulationCanvas, consumed by CodeSandbox
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const worldRef = useRef(null);
  const animationCallbacksRef = useRef([]);
  const currentCleanupRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  const containerRef = useRef(null);

  // Engine readiness
  const [isReady, setIsReady] = useState(false);

  // Simulation state
  const [executionStatus, setExecutionStatus] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeReasoning, setCodeReasoning] = useState('');

  // AI conversation state
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [solutionSteps, setSolutionSteps] = useState([]);
  const [physicsParams, setPhysicsParams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation control state
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(10);

  const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);
  const resetAnimation = useCallback(() => {
    setElapsedTime(0);
    setIsPlaying(true);
  }, []);
  const updateElapsedTime = useCallback((delta) => {
    setElapsedTime(prev => prev + delta);
  }, []);
  const resetScene = useCallback(() => {
    animationCallbacksRef.current = [];

    const scene = sceneRef.current;
    if (scene) {
      const objectsToRemove = [];
      scene.traverse((object) => {
        // Skip the scene itself, lights, and ground objects
        if (object === scene) return;
        if (object.isLight) return;
        if (object.userData.isGround) return;

        // Only collect direct children of scene to avoid removing
        // sub-parts of compound objects like ArrowHelper (Group with line + cone)
        if (object.parent === scene) {
          objectsToRemove.push(object);
        }
      });

      objectsToRemove.forEach((obj) => {
        // SimulationHelpers objects have their own dispose() that handles
        // scene.remove + geometry/material cleanup
        if (typeof obj.dispose === 'function') {
          obj.dispose();
        } else {
          scene.remove(obj);
          // Recursively dispose geometry and materials for all children
          obj.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }
      });
    }

    // Clean up HUD overlay DOM elements
    const container = containerRef?.current;
    if (container) {
      const hudElements = container.querySelectorAll('div[style*="pointer-events: none"]');
      hudElements.forEach((el) => el.remove());
    }

    currentCleanupRef.current = null;
    setExecutionStatus('');
    setGeneratedCode('');
    setCodeReasoning('');
    setElapsedTime(0);
    setIsPlaying(true);
    setSpeed(1);
  }, []);

  const value = {
    // Three.js refs
    sceneRef,
    cameraRef,
    rendererRef,
    worldRef,
    animationCallbacksRef,
    currentCleanupRef,
    lastTimeRef,
    containerRef,

    // Engine state
    isReady,
    setIsReady,

    // Simulation state
    executionStatus,
    setExecutionStatus,
    generatedCode,
    setGeneratedCode,
    codeReasoning,
    setCodeReasoning,

    // AI state
    message,
    setMessage,
    response,
    setResponse,
    solutionSteps,
    setSolutionSteps,
    physicsParams,
    setPhysicsParams,
    isLoading,
    setIsLoading,

    // Animation control
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    elapsedTime,
    setElapsedTime,
    totalDuration,
    setTotalDuration,
    togglePlay,
    resetAnimation,
    updateElapsedTime,

    // Actions
    resetScene,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export default SimulationContext;
