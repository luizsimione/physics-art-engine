import { useState } from 'react';
import type { StreamParams, StreamStatus, VisualizationMode } from '../types/simulation';
import './ControlPanel.css';

interface ControlPanelProps {
  status: StreamStatus;
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  onStart: (params: StreamParams) => void;
  onStop: () => void;
}

export default function ControlPanel({
  status,
  mode,
  onModeChange,
  onStart,
  onStop,
}: ControlPanelProps) {
  const [params, setParams] = useState<StreamParams>({
    numParticles: 50,
    steps: 10000,
    seed: undefined,
    fps: 30,
    dt: 0.01,
  });

  const handleStart = () => {
    onStart(params);
  };

  return (
    <div className="control-panel">
      <div className="panel-section">
        <h2>Physics Art Engine</h2>
        <div className="status">
          <div className={`indicator ${status.connected ? 'connected' : 'disconnected'}`} />
          <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="panel-section">
        <h3>Visualization Mode</h3>
        <div className="button-group">
          <button
            className={mode === 'waveform' ? 'active' : ''}
            onClick={() => onModeChange('waveform')}
            disabled={status.streaming}
          >
            Waveform
          </button>
          <button
            className={mode === 'multichannel' ? 'active' : ''}
            onClick={() => onModeChange('multichannel')}
            disabled={status.streaming}
          >
            Multi-Channel
          </button>
          <button
            className={mode === 'vectorscope' ? 'active' : ''}
            onClick={() => onModeChange('vectorscope')}
            disabled={status.streaming}
          >
            Vector Scope
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>Simulation Parameters</h3>
        
        <label>
          Particles: {params.numParticles}
          <input
            type="range"
            min="10"
            max="200"
            value={params.numParticles}
            onChange={(e) =>
              setParams({ ...params, numParticles: parseInt(e.target.value) })
            }
            disabled={status.streaming}
          />
        </label>

        <label>
          Steps: {params.steps}
          <input
            type="range"
            min="100"
            max="50000"
            step="100"
            value={params.steps}
            onChange={(e) => setParams({ ...params, steps: parseInt(e.target.value) })}
            disabled={status.streaming}
          />
        </label>

        <label>
          FPS: {params.fps}
          <input
            type="range"
            min="10"
            max="60"
            value={params.fps}
            onChange={(e) => setParams({ ...params, fps: parseInt(e.target.value) })}
            disabled={status.streaming}
          />
        </label>

        <label>
          Seed (optional)
          <input
            type="number"
            placeholder="Auto-generated"
            value={params.seed || ''}
            onChange={(e) =>
              setParams({
                ...params,
                seed: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            disabled={status.streaming}
          />
        </label>

        <label>
          Time Step (dt): {params.dt}
          <input
            type="range"
            min="0.001"
            max="0.1"
            step="0.001"
            value={params.dt}
            onChange={(e) => setParams({ ...params, dt: parseFloat(e.target.value) })}
            disabled={status.streaming}
          />
        </label>
      </div>

      <div className="panel-section">
        <div className="button-group">
          {!status.streaming ? (
            <button
              className="primary"
              onClick={handleStart}
              disabled={!status.connected}
            >
              Start Stream
            </button>
          ) : (
            <button className="danger" onClick={onStop}>
              Stop Stream
            </button>
          )}
        </div>
      </div>

      {status.streaming && (
        <div className="panel-section stats">
          <h3>Statistics</h3>
          <div className="stat-row">
            <span>Frame:</span>
            <span className="stat-value">{status.frameCount}</span>
          </div>
          <div className="stat-row">
            <span>FPS:</span>
            <span className="stat-value">{status.fps.toFixed(1)}</span>
          </div>
        </div>
      )}

      {status.error && (
        <div className="panel-section error">
          <strong>Error:</strong> {status.error}
        </div>
      )}
    </div>
  );
}
