#!/usr/bin/env node
/**
 * WebSocket Streaming Test Client
 * 
 * This script connects to the backend WebSocket server and streams
 * simulation frames in real-time. Use this to test the streaming
 * functionality before the frontend is built.
 * 
 * Usage:
 *   node test-websocket-client.js [options]
 * 
 * Options:
 *   --particles <n>  Number of particles (default: 50)
 *   --steps <n>      Number of steps (default: 1000)
 *   --seed <n>       Random seed (default: auto-generated)
 *   --fps <n>        Target FPS (default: 30)
 *   --url <url>      WebSocket URL (default: ws://localhost:3001)
 */

const io = require('socket.io-client');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const config = {
  url: getArg('url', 'ws://localhost:3001'),
  numParticles: parseInt(getArg('particles', '50')),
  steps: parseInt(getArg('steps', '1000')),
  seed: getArg('seed') ? parseInt(getArg('seed')) : undefined,
  fps: parseInt(getArg('fps', '30')),
};

console.log('🚀 Physics Art Engine - WebSocket Test Client\n');
console.log('Configuration:');
console.log(`  URL:       ${config.url}`);
console.log(`  Particles: ${config.numParticles}`);
console.log(`  Steps:     ${config.steps}`);
console.log(`  Seed:      ${config.seed || 'auto-generated'}`);
console.log(`  FPS:       ${config.fps}\n`);

// Connect to WebSocket server
const socket = io(config.url, {
  transports: ['websocket'],
});

let frameCount = 0;
let startTime;

socket.on('connect', () => {
  console.log('✓ Connected to server');
  console.log('→ Starting simulation stream...\n');

  // Start the stream
  const streamParams = {
    numParticles: config.numParticles,
    steps: config.steps,
    fps: config.fps,
  };

  if (config.seed !== undefined) {
    streamParams.seed = config.seed;
  }

  socket.emit('start-stream', streamParams);
  startTime = Date.now();
});

socket.on('stream-started', (data) => {
  console.log('✓ Stream started:', data.message);
  console.log('  Parameters:', JSON.stringify(data.params, null, 2));
  console.log('\n→ Receiving frames...\n');
});

socket.on('frame', (data) => {
  frameCount++;
  
  // Display progress every 30 frames (approximately once per second at 30 FPS)
  if (frameCount % 30 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const actualFps = (frameCount / (elapsed || 1)).toFixed(1);
    
    console.log(`Frame ${data.frame.toString().padStart(5)} | ` +
                `Particles: ${data.particles.length.toString().padStart(3)} | ` +
                `Elapsed: ${elapsed}s | ` +
                `FPS: ${actualFps}`);
    
    // Display first particle position for verification
    if (data.particles.length > 0) {
      const p = data.particles[0];
      console.log(`  → Particle[0]: x=${p.x.toFixed(3)}, y=${p.y.toFixed(3)}, ` +
                  `vx=${p.vx.toFixed(3)}, vy=${p.vy.toFixed(3)}`);
    }
  }
});

socket.on('stream-stopped', (data) => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgFps = (frameCount / (elapsed || 1)).toFixed(1);
  
  console.log('\n✓ Stream stopped:', data.message);
  console.log(`\nStatistics:`);
  console.log(`  Total Frames:   ${frameCount}`);
  console.log(`  Elapsed Time:   ${elapsed}s`);
  console.log(`  Average FPS:    ${avgFps}`);
  console.log(`  Expected FPS:   ${config.fps}`);
  
  socket.disconnect();
  process.exit(0);
});

socket.on('stream-error', (data) => {
  console.error('\n✗ Stream error:', data.message);
  socket.disconnect();
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('\n✗ Disconnected from server');
  
  if (frameCount > 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgFps = (frameCount / (elapsed || 1)).toFixed(1);
    
    console.log(`\nReceived ${frameCount} frames in ${elapsed}s (${avgFps} FPS)`);
  }
  
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('\n✗ Connection error:', error.message);
  console.error('\nMake sure the backend server is running:');
  console.error('  cd backend && npm run start:dev\n');
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n→ Stopping stream...');
  socket.emit('stop-stream');
  
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

console.log('Connecting to', config.url, '...');
console.log('(Press Ctrl+C to stop)\n');
