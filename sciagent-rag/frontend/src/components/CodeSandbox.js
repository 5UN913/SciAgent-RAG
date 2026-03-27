import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {
  createVector,
  updateVector,
  createTrail,
  createLabel,
  updateLabel,
  createDashedLine,
  updateDashedLine,
  createHUD,
} from './SimulationHelpers';

/**
 * CodeSandbox — executes LLM-generated Three.js code in a sandboxed Function.
 * This is a utility module, not a React component.
 *
 * @param {string} code - Clean JavaScript code to execute
 * @param {object} refs - Three.js refs from SimulationContext
 * @param {Function} refs.sceneRef
 * @param {Function} refs.cameraRef
 * @param {Function} refs.rendererRef
 * @param {Function} refs.worldRef
 * @param {Function} refs.animationCallbacksRef
 * @param {Function} refs.currentCleanupRef
 * @param {Function} refs.containerRef - ref to the canvas container DOM element
 * @returns {{ success: boolean, error?: string }}
 */
export function executeCode(code, refs) {
  const {
    sceneRef,
    cameraRef,
    rendererRef,
    worldRef,
    animationCallbacksRef,
    currentCleanupRef,
    containerRef,
  } = refs;

  try {
    // Step 1: Clean up previous simulation
    if (currentCleanupRef.current) {
      currentCleanupRef.current();
      currentCleanupRef.current = null;
    }

    // Step 2: Clear animation callbacks
    animationCallbacksRef.current = [];

    // Step 3: Get rendering context
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const world = worldRef.current;

    if (!scene || !camera || !renderer) {
      return { success: false, error: 'Rendering context not initialized' };
    }

    // Step 4: Build sandbox environment
    const animate = (callback) => {
      animationCallbacksRef.current.push(callback);
    };

    const stopAnimation = () => {
      animationCallbacksRef.current = [];
    };

    const container = containerRef?.current;

    const sandbox = {
      THREE,
      RAPIER,
      scene,
      camera,
      renderer,
      world,
      animate,
      stopAnimation,
      // Physics visualization helpers (scene is pre-bound)
      createVector: (origin, direction, length, color) => createVector(scene, origin, direction, length, color),
      updateVector,
      createTrail: (color, maxPoints) => createTrail(scene, color, maxPoints),
      createLabel: (text, position, fontSize, color) => createLabel(scene, text, position, fontSize, color),
      updateLabel,
      createDashedLine: (from, to, color) => createDashedLine(scene, from, to, color),
      updateDashedLine,
      createHUD: () => container ? createHUD(container) : null,
    };

    const executeFunction = new Function(...Object.keys(sandbox), code);
    executeFunction(...Object.values(sandbox));

    // Wrap callbacks with error counting — auto-stop after 5 consecutive errors
    const rawCallbacks = [...animationCallbacksRef.current];
    animationCallbacksRef.current = [];
    let errorCount = 0;
    rawCallbacks.forEach((cb) => {
      animationCallbacksRef.current.push((dt) => {
        try {
          cb(dt);
          errorCount = 0;
        } catch (err) {
          errorCount++;
          if (errorCount >= 5) {
            animationCallbacksRef.current = [];
            console.error('Animation stopped: too many errors', err);
          }
        }
      });
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `${error.name}: ${error.message}`,
    };
  }
}

/**
 * Extract clean executable code from various LLM output formats.
 * Handles: raw JSON with "code" field, Markdown code blocks, plain code.
 *
 * @param {string} rawCode - Raw code from LLM response
 * @returns {string} Clean executable JavaScript
 */
export function extractCode(rawCode) {
  let code = rawCode.trim();

  // Try JSON parse ({"code": "...", "reasoning": "..."})
  try {
    const parsed = JSON.parse(code);
    if (parsed.code) {
      code = parsed.code;
    }
  } catch {
    // Not JSON, continue
  }

  // Try Markdown code block extraction
  const codeBlockMatch = /```(?:javascript|js)?\s*([\s\S]*?)```/.exec(code);
  if (codeBlockMatch) {
    code = codeBlockMatch[1];
  }

  return code.trim();
}
