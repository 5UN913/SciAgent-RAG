import React from 'react';
import { useSimulation } from '../context/SimulationContext';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];

function AnimationControls() {
  const { isPlaying, togglePlay, resetAnimation, speed, setSpeed, elapsedTime } =
    useSimulation();

  return (
    <div className="animation-controls">
      <button
        className="control-btn play-btn"
        onClick={togglePlay}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button
        className="control-btn"
        onClick={resetAnimation}
        title="重播"
      >
        ↻
      </button>

      <div className="control-separator" />

      <div className="speed-group">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            className={`control-btn${speed === s ? ' active' : ''}`}
            onClick={() => setSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>

      <span className="time-display">t = {elapsedTime.toFixed(1)}s</span>
    </div>
  );
}

export default AnimationControls;
