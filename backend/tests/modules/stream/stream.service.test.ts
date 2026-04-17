import { Test, TestingModule } from '@nestjs/testing';
import { StreamService } from '../../../src/modules/stream/stream.service';
import { EventEmitter } from 'events';

// Mock child_process
jest.mock('child_process');

describe('StreamService', () => {
  let service: StreamService;
  let mockProcess: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StreamService],
    }).compile();

    service = module.get<StreamService>(StreamService);

    // Create mock process
    mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.kill = jest.fn();

    // Mock spawn to return our mock process
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { spawn } = require('child_process');
    (spawn as jest.Mock).mockReturnValue(mockProcess);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startStream', () => {
    it('should spawn simulation process with correct arguments', async () => {
      const clientId = 'test-client-1';
      const params = {
        numParticles: 100,
        steps: 1000,
        seed: 42,
        fps: 30,
        dt: 0.01,
      };
      const onFrame = jest.fn();

      await service.startStream(clientId, params, onFrame);

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { spawn } = require('child_process');
      expect(spawn).toHaveBeenCalledWith(
        expect.stringContaining('sim'),
        expect.arrayContaining([
          '--particles',
          '100',
          '--steps',
          '1000',
          '--seed',
          '42',
          '--mode',
          'stream',
          '--dt',
          '0.01',
        ]),
      );
    });

    it('should generate seed if not provided', async () => {
      const clientId = 'test-client-2';
      const params = {
        numParticles: 50,
        steps: 500,
        fps: 30,
        dt: 0.01,
      };
      const onFrame = jest.fn();

      await service.startStream(clientId, params, onFrame);

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { spawn } = require('child_process');
      const spawnCall = (spawn as jest.Mock).mock.calls[0];
      const args = spawnCall[1];

      const seedIndex = args.indexOf('--seed');
      expect(seedIndex).toBeGreaterThan(-1);
      expect(parseInt(args[seedIndex + 1])).toBeGreaterThan(0);
    });

    it('should parse and emit frames from stdout', async () => {
      const clientId = 'test-client-3';
      const params = {
        numParticles: 10,
        steps: 10,
        seed: 42,
        fps: 1000, // High FPS to ensure immediate emission
        dt: 0.01,
      };
      const onFrame = jest.fn();

      await service.startStream(clientId, params, onFrame);

      const frameData = {
        frame: 1,
        particles: [{ x: 0.5, y: 0.5, vx: 0.1, vy: -0.1, mass: 1.0 }],
      };

      // Simulate stdout data
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(frameData) + '\n'));

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onFrame).toHaveBeenCalledWith(frameData);
    });

    it('should throttle frames based on FPS', async () => {
      const clientId = 'test-client-4';
      const params = {
        numParticles: 10,
        steps: 100,
        seed: 42,
        fps: 10, // 100ms per frame
        dt: 0.01,
      };
      const onFrame = jest.fn();

      await service.startStream(clientId, params, onFrame);

      // Send 5 frames quickly
      for (let i = 0; i < 5; i++) {
        const frameData = { frame: i, particles: [] };
        mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(frameData) + '\n'));
      }

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should only emit 1 or 2 frames due to throttling
      expect(onFrame.mock.calls.length).toBeLessThan(5);
    });

    it('should handle incomplete JSON lines', async () => {
      const clientId = 'test-client-5';
      const params = {
        numParticles: 10,
        steps: 10,
        seed: 42,
        fps: 1000, // High FPS to ensure immediate emission
        dt: 0.01,
      };
      const onFrame = jest.fn();

      await service.startStream(clientId, params, onFrame);

      const frameData = { frame: 1, particles: [] };
      const jsonString = JSON.stringify(frameData);

      // Send incomplete data
      mockProcess.stdout.emit('data', Buffer.from(jsonString.substring(0, 10)));
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(onFrame).not.toHaveBeenCalled();

      // Send rest of data
      mockProcess.stdout.emit('data', Buffer.from(jsonString.substring(10) + '\n'));
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(onFrame).toHaveBeenCalledWith(frameData);
    });
  });

  describe('stopStream', () => {
    it('should kill process and remove session', async () => {
      const clientId = 'test-client-6';
      const params = {
        numParticles: 10,
        steps: 10,
        seed: 42,
        fps: 30,
        dt: 0.01,
      };
      const onFrame = jest.fn();

      await service.startStream(clientId, params, onFrame);
      service.stopStream(clientId);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should handle stopping non-existent stream', () => {
      expect(() => service.stopStream('non-existent-client')).not.toThrow();
    });

    it('should stop existing stream before starting new one', async () => {
      const clientId = 'test-client-7';
      const params = {
        numParticles: 10,
        steps: 10,
        seed: 42,
        fps: 30,
        dt: 0.01,
      };
      const onFrame = jest.fn();

      await service.startStream(clientId, params, onFrame);
      const firstProcess = mockProcess;

      // Start another stream with same client ID
      await service.startStream(clientId, params, onFrame);

      expect(firstProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('onModuleDestroy', () => {
    it('should cleanup all active streams', async () => {
      const params = {
        numParticles: 10,
        steps: 10,
        seed: 42,
        fps: 30,
        dt: 0.01,
      };
      const onFrame = jest.fn();

      await service.startStream('client-1', params, onFrame);
      await service.startStream('client-2', params, onFrame);

      service.onModuleDestroy();

      expect(mockProcess.kill).toHaveBeenCalledTimes(2);
    });
  });
});
