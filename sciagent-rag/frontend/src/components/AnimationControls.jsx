import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSimulation, CANVAS_SIZES } from '../context/SimulationContext';

const SPEED_PRESETS = [0.25, 0.5, 1, 2, 4];

const SIZE_OPTIONS = [
  { key: 'compact', icon: '⬜', label: '紧凑' },
  { key: 'normal', icon: '◻', label: '标准' },
  { key: 'expanded', icon: '◼', label: '展开' },
];

function AnimationControls() {
  const {
    isPlaying,
    togglePlay,
    resetAnimation,
    speed,
    setSpeed,
    elapsedTime,
    stepForward,
    canvasSize,
    setCanvasSize,
    isFullscreen,
    toggleFullscreen,
  } = useSimulation();

  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  useEffect(() => {
    let rafId;
    const measure = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleSpeedSlider = useCallback((e) => {
    setSpeed(parseFloat(e.target.value));
  }, [setSpeed]);

  const handleSizeChange = useCallback((size) => {
    setCanvasSize(size);
  }, [setCanvasSize]);

  return (
    <div className={`animation-controls ${isFullscreen ? 'fullscreen-overlay' : ''}`}>
      <div className="controls-group controls-playback">
        <button
          className="control-btn play-btn"
          onClick={togglePlay}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="control-btn step-btn"
          onClick={stepForward}
          title="逐帧前进"
        >
          ▶|
        </button>
        <button
          className="control-btn reset-btn"
          onClick={resetAnimation}
          title="重播"
        >
          ↻
        </button>
      </div>

      <div className="control-separator" />

      <div className="controls-group controls-speed">
        <div className="speed-slider-container">
          <label className="speed-label">速度</label>
          <input
            type="range"
            className="speed-slider"
            min="0.1"
            max="5"
            step="0.1"
            value={speed}
            onChange={handleSpeedSlider}
          />
          <span className="speed-value">{speed.toFixed(1)}x</span>
        </div>
        <div className="speed-presets">
          {SPEED_PRESETS.map((s) => (
            <button
              key={s}
              className={`control-btn speed-preset-btn${Math.abs(speed - s) < 0.05 ? ' active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="control-separator" />

      <div className="controls-group controls-info">
        <span className="time-display">t = {elapsedTime.toFixed(1)}s</span>
        {fps > 0 && <span className="fps-display">{fps} FPS</span>}
      </div>

      <div className="control-separator" />

      <div className="controls-group controls-view">
        <div className="size-toggle">
          {SIZE_OPTIONS.map(({ key, icon, label }) => (
            <button
              key={key}
              className={`control-btn size-btn${canvasSize === key ? ' active' : ''}`}
              onClick={() => handleSizeChange(key)}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
        <button
          className="control-btn fullscreen-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>
      </div>
    </div>
  );
}

export default AnimationControls;