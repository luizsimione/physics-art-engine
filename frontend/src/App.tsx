import { useState } from 'react';
import Oscilloscope from './components/Oscilloscope';
import ControlPanel from './components/ControlPanel';
import { useWebSocket } from './hooks/useWebSocket';
import type { VisualizationMode } from './types/simulation';
import './App.css';

function App() {
  const [mode, setMode] = useState<VisualizationMode>('vectorscope');
  const { status, currentFrame, startStream, stopStream } = useWebSocket();

  return (
    <div className="app">
      <Oscilloscope frame={currentFrame} mode={mode} />
      <ControlPanel
        status={status}
        mode={mode}
        onModeChange={setMode}
        onStart={startStream}
        onStop={stopStream}
      />
    </div>
  );
}

export default App;
