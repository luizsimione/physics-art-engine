import { Test, TestingModule } from '@nestjs/testing';
import { StreamGateway } from '../../../src/modules/stream/stream.gateway';
import { StreamService } from '../../../src/modules/stream/stream.service';
import { Socket } from 'socket.io';

describe('StreamGateway', () => {
  let gateway: StreamGateway;
  let streamService: StreamService;
  let mockClient: Partial<Socket>;

  beforeEach(async () => {
    const mockStreamService = {
      startStream: jest.fn(),
      stopStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamGateway,
        {
          provide: StreamService,
          useValue: mockStreamService,
        },
      ],
    }).compile();

    gateway = module.get<StreamGateway>(StreamGateway);
    streamService = module.get<StreamService>(StreamService);

    mockClient = {
      id: 'test-client-id',
      emit: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      gateway.handleConnection(mockClient as Socket);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Client connected'));
    });
  });

  describe('handleDisconnect', () => {
    it('should stop stream and log disconnection', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      gateway.handleDisconnect(mockClient as Socket);

      expect(streamService.stopStream).toHaveBeenCalledWith('test-client-id');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Client disconnected'));
    });
  });

  describe('handleStartStream', () => {
    it('should start stream with valid data', async () => {
      const data = {
        numParticles: 100,
        steps: 1000,
        seed: 42,
        fps: 30,
        dt: 0.01,
      };

      (streamService.startStream as jest.Mock).mockResolvedValue(undefined);

      await gateway.handleStartStream(data, mockClient as Socket);

      expect(streamService.startStream).toHaveBeenCalledWith(
        'test-client-id',
        data,
        expect.any(Function),
      );

      expect(mockClient.emit).toHaveBeenCalledWith('stream-started', {
        message: 'Simulation stream started',
        params: data,
      });
    });

    it('should emit error if stream fails to start', async () => {
      const data = {
        numParticles: 100,
        steps: 1000,
        seed: 42,
        fps: 30,
        dt: 0.01,
      };

      const error = new Error('Failed to start simulation');
      (streamService.startStream as jest.Mock).mockRejectedValue(error);

      await gateway.handleStartStream(data, mockClient as Socket);

      expect(mockClient.emit).toHaveBeenCalledWith('stream-error', {
        message: 'Failed to start simulation',
      });
    });

    it('should call onFrame callback when receiving frames', async () => {
      const data = {
        numParticles: 100,
        steps: 1000,
        seed: 42,
        fps: 30,
        dt: 0.01,
      };

      let capturedCallback: (frame: any) => void;
      (streamService.startStream as jest.Mock).mockImplementation(
        async (clientId, params, onFrame) => {
          capturedCallback = onFrame;
        },
      );

      await gateway.handleStartStream(data, mockClient as Socket);

      const testFrame = {
        frame: 1,
        particles: [{ x: 0, y: 0, vx: 0, vy: 0, mass: 1 }],
      };

      capturedCallback!(testFrame);

      expect(mockClient.emit).toHaveBeenCalledWith('frame', testFrame);
    });
  });

  describe('handleStopStream', () => {
    it('should stop stream and emit confirmation', () => {
      gateway.handleStopStream(mockClient as Socket);

      expect(streamService.stopStream).toHaveBeenCalledWith('test-client-id');
      expect(mockClient.emit).toHaveBeenCalledWith('stream-stopped', {
        message: 'Simulation stream stopped',
      });
    });
  });
});
