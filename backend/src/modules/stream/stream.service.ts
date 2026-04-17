import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { StartStreamDto } from './dto/start-stream.dto';

interface StreamSession {
  process: ChildProcess;
  frameCount: number;
  lastFrameTime: number;
  targetFrameInterval: number;
}

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private readonly sessions = new Map<string, StreamSession>();
  private readonly simBinaryPath = join(process.cwd(), '..', 'simulation-engine', 'sim');

  async startStream(
    clientId: string,
    params: StartStreamDto,
    onFrame: (frame: any) => void,
  ): Promise<void> {
    // Stop existing stream if any
    this.stopStream(clientId);

    const { numParticles, steps = 10000, seed, fps = 30, dt = 0.01 } = params;
    const targetFrameInterval = 1000 / fps; // milliseconds per frame

    // Generate seed if not provided
    const actualSeed = seed ?? Math.floor(Math.random() * 1000000);

    const args = [
      '--particles',
      numParticles.toString(),
      '--steps',
      steps.toString(),
      '--seed',
      actualSeed.toString(),
      '--mode',
      'stream',
      '--dt',
      dt.toString(),
    ];

    this.logger.log(`Spawning simulation: ${this.simBinaryPath} ${args.join(' ')}`);

    const simProcess = spawn(this.simBinaryPath, args);

    const session: StreamSession = {
      process: simProcess,
      frameCount: 0,
      lastFrameTime: 0, // Initialize to 0 to allow first frame immediately
      targetFrameInterval,
    };

    this.sessions.set(clientId, session);

    let buffer = '';

    simProcess.stdout.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const frame = JSON.parse(line);
            this.handleFrame(clientId, frame, onFrame);
          } catch (error) {
            this.logger.error(`Failed to parse frame: ${error.message}`);
          }
        }
      }
    });

    simProcess.stderr.on('data', (data: Buffer) => {
      this.logger.error(`Simulation stderr: ${data.toString()}`);
    });

    simProcess.on('error', (error) => {
      this.logger.error(`Simulation process error: ${error.message}`);
      this.sessions.delete(clientId);
    });

    simProcess.on('close', (code) => {
      this.logger.log(`Simulation completed for client ${clientId} with code ${code}`);
      this.sessions.delete(clientId);
    });
  }

  private handleFrame(clientId: string, frame: any, onFrame: (frame: any) => void): void {
    const session = this.sessions.get(clientId);
    if (!session) return;

    const now = Date.now();
    const timeSinceLastFrame = now - session.lastFrameTime;

    // Throttle frames based on target FPS
    if (timeSinceLastFrame >= session.targetFrameInterval) {
      onFrame(frame);
      session.frameCount++;
      session.lastFrameTime = now;

      if (session.frameCount % 100 === 0) {
        this.logger.debug(`Client ${clientId}: Sent ${session.frameCount} frames`);
      }
    }
    // Otherwise skip frame (backpressure handling)
  }

  stopStream(clientId: string): void {
    const session = this.sessions.get(clientId);
    if (session) {
      this.logger.log(`Stopping stream for client ${clientId}`);
      session.process.kill('SIGTERM');
      this.sessions.delete(clientId);
    }
  }

  // Cleanup on service shutdown
  onModuleDestroy() {
    this.logger.log('Cleaning up active streams');
    for (const [clientId, session] of this.sessions.entries()) {
      session.process.kill('SIGTERM');
      this.sessions.delete(clientId);
    }
  }
}
