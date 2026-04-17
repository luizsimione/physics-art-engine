import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Frame, StreamParams, StreamStatus } from '../types/simulation';

interface UseWebSocketReturn {
  status: StreamStatus;
  currentFrame: Frame | null;
  startStream: (params: StreamParams) => void;
  stopStream: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<StreamStatus>({
    connected: false,
    streaming: false,
    frameCount: 0,
    fps: 0,
  });
  const [currentFrame, setCurrentFrame] = useState<Frame | null>(null);
  
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() });

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✓ Connected to backend');
      setStatus((prev) => ({ ...prev, connected: true, error: undefined }));
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Disconnected from backend');
      setStatus((prev) => ({
        ...prev,
        connected: false,
        streaming: false,
      }));
    });

    newSocket.on('stream-started', (data: { message: string; params: StreamParams }) => {
      console.log('✓ Stream started:', data);
      setStatus((prev) => ({ ...prev, streaming: true, frameCount: 0 }));
      fpsCounterRef.current = { count: 0, lastTime: Date.now() };
    });

    newSocket.on('frame', (frame: Frame) => {
      setCurrentFrame(frame);
      
      // Update FPS calculation
      const counter = fpsCounterRef.current;
      counter.count++;
      const now = Date.now();
      const elapsed = now - counter.lastTime;
      
      if (elapsed >= 1000) {
        const fps = (counter.count / elapsed) * 1000;
        setStatus((prev) => ({
          ...prev,
          frameCount: frame.frame,
          fps: Math.round(fps * 10) / 10,
        }));
        counter.count = 0;
        counter.lastTime = now;
      } else {
        setStatus((prev) => ({ ...prev, frameCount: frame.frame }));
      }
    });

    newSocket.on('stream-stopped', (data: { message: string }) => {
      console.log('✓ Stream stopped:', data.message);
      setStatus((prev) => ({ ...prev, streaming: false }));
    });

    newSocket.on('stream-error', (data: { message: string }) => {
      console.error('✗ Stream error:', data.message);
      setStatus((prev) => ({
        ...prev,
        streaming: false,
        error: data.message,
      }));
    });

    newSocket.on('connect_error', (error) => {
      console.error('✗ Connection error:', error.message);
      setStatus((prev) => ({
        ...prev,
        connected: false,
        error: `Connection failed: ${error.message}`,
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const startStream = useCallback(
    (params: StreamParams) => {
      if (socket && status.connected) {
        console.log('→ Starting stream with params:', params);
        socket.emit('start-stream', params);
      } else {
        console.error('Cannot start stream: not connected');
      }
    },
    [socket, status.connected]
  );

  const stopStream = useCallback(() => {
    if (socket) {
      console.log('→ Stopping stream');
      socket.emit('stop-stream');
    }
  }, [socket]);

  return {
    status,
    currentFrame,
    startStream,
    stopStream,
  };
}
