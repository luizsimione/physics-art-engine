import { Test, TestingModule } from '@nestjs/testing';
import { SimulationProcessor } from '../../../src/modules/simulation/simulation.processor';
import { SimulationService } from '../../../src/modules/simulation/simulation.service';
import { Job } from 'bullmq';
import { JobStatus } from '../../../src/modules/simulation/entities/simulation-job.entity';

describe('SimulationProcessor', () => {
  let processor: SimulationProcessor;

  const mockSimulationService = {
    updateJobStatus: jest.fn(),
    updateProcessingTime: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationProcessor,
        {
          provide: SimulationService,
          useValue: mockSimulationService,
        },
      ],
    }).compile();

    processor = module.get<SimulationProcessor>(SimulationProcessor);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const mockJobData = {
      jobId: 'test-job-id',
      numParticles: 50,
      steps: 100,
      seed: 42,
      dt: 0.01,
    };

    const createMockJob = (data: any): Job => {
      return {
        data,
        id: data.jobId,
        name: 'process-simulation',
      } as Job;
    };

    it('should update status to processing when job starts', async () => {
      const mockJob = createMockJob(mockJobData);

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      jest.spyOn<any, any>(processor, 'runSimulation').mockResolvedValue(undefined);

      await processor.process(mockJob);

      expect(mockSimulationService.updateJobStatus).toHaveBeenCalledWith(
        'test-job-id',
        JobStatus.PROCESSING,
      );
    });

    it('should update status to completed on success', async () => {
      const mockJob = createMockJob(mockJobData);

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      jest.spyOn<any, any>(processor, 'runSimulation').mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockSimulationService.updateJobStatus).toHaveBeenNthCalledWith(
        2,
        'test-job-id',
        JobStatus.COMPLETED,
        expect.stringContaining('frames.json'),
      );

      expect(mockSimulationService.updateProcessingTime).toHaveBeenCalledWith(
        'test-job-id',
        expect.any(Number),
      );

      expect(result).toEqual({
        success: true,
        outputFile: expect.stringContaining('frames.json'),
        processingTime: expect.any(Number),
      });
    });

    it('should update status to failed on error', async () => {
      const mockJob = createMockJob(mockJobData);

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      const simulationError = new Error('Simulation binary not found');
      jest.spyOn<any, any>(processor, 'runSimulation').mockRejectedValue(simulationError);

      await expect(processor.process(mockJob)).rejects.toThrow('Simulation binary not found');

      expect(mockSimulationService.updateJobStatus).toHaveBeenCalledWith(
        'test-job-id',
        JobStatus.FAILED,
        null,
        'Simulation binary not found',
      );
    });

    it('should record processing time even on failure', async () => {
      const mockJob = createMockJob(mockJobData);

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      jest.spyOn<any, any>(processor, 'runSimulation').mockRejectedValue(new Error('Failed'));

      await expect(processor.process(mockJob)).rejects.toThrow('Failed');

      expect(mockSimulationService.updateProcessingTime).toHaveBeenCalledWith(
        'test-job-id',
        expect.any(Number),
      );
    });

    it('should handle errors during status update', async () => {
      const mockJob = createMockJob(mockJobData);

      mockSimulationService.updateJobStatus.mockRejectedValue(new Error('Database error'));

      await expect(processor.process(mockJob)).rejects.toThrow('Database error');
    });

    it('should create job-specific output directory', async () => {
      const mockJob = createMockJob(mockJobData);

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      jest.spyOn<any, any>(processor, 'runSimulation').mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(result.outputFile).toContain('test-job-id');
      expect(result.outputFile).toContain('frames.json');
    });

    it('should pass correct parameters to simulation', async () => {
      const mockJob = createMockJob({
        jobId: 'custom-job',
        numParticles: 200,
        steps: 500,
        seed: 999,
        dt: 0.005,
      });

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      const runSimulationSpy = jest
        .spyOn<any, any>(processor, 'runSimulation')
        .mockResolvedValue(undefined);

      await processor.process(mockJob);

      expect(runSimulationSpy).toHaveBeenCalledWith(
        200,
        500,
        999,
        0.005,
        expect.stringContaining('custom-job'),
      );
    });
  });

  describe('edge cases', () => {
    const createMockJob = (data: any): Job => {
      return {
        data,
        id: data.jobId,
        name: 'process-simulation',
      } as Job;
    };

    it('should handle minimum particle count', async () => {
      const mockJob = createMockJob({
        jobId: 'min-particles',
        numParticles: 1,
        steps: 10,
        seed: 42,
        dt: 0.01,
      });

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      jest.spyOn<any, any>(processor, 'runSimulation').mockResolvedValue(undefined);

      await expect(processor.process(mockJob)).resolves.toBeDefined();
    });

    it('should handle large particle count', async () => {
      const mockJob = createMockJob({
        jobId: 'max-particles',
        numParticles: 10000,
        steps: 100,
        seed: 42,
        dt: 0.01,
      });

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      jest.spyOn<any, any>(processor, 'runSimulation').mockResolvedValue(undefined);

      await expect(processor.process(mockJob)).resolves.toBeDefined();
    });

    it('should handle zero seed', async () => {
      const mockJob = createMockJob({
        jobId: 'zero-seed',
        numParticles: 50,
        steps: 100,
        seed: 0,
        dt: 0.01,
      });

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      const runSimulationSpy = jest
        .spyOn<any, any>(processor, 'runSimulation')
        .mockResolvedValue(undefined);

      await processor.process(mockJob);

      expect(runSimulationSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        0,
        expect.any(Number),
        expect.any(String),
      );
    });

    it('should handle very small dt value', async () => {
      const mockJob = createMockJob({
        jobId: 'small-dt',
        numParticles: 50,
        steps: 100,
        seed: 42,
        dt: 0.0001,
      });

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      const runSimulationSpy = jest
        .spyOn<any, any>(processor, 'runSimulation')
        .mockResolvedValue(undefined);

      await processor.process(mockJob);

      expect(runSimulationSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        0.0001,
        expect.any(String),
      );
    });
  });

  describe('performance tracking', () => {
    const createMockJob = (data: any): Job => {
      return {
        data,
        id: data.jobId,
        name: 'process-simulation',
      } as Job;
    };

    it('should track processing time accurately', async () => {
      const mockJob = createMockJob({
        jobId: 'perf-test',
        numParticles: 50,
        steps: 100,
        seed: 42,
        dt: 0.01,
      });

      mockSimulationService.updateJobStatus.mockResolvedValue(undefined);
      mockSimulationService.updateProcessingTime.mockResolvedValue(undefined);

      jest.spyOn<any, any>(processor, 'runSimulation').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await processor.process(mockJob);

      expect(mockSimulationService.updateProcessingTime).toHaveBeenCalledWith(
        'perf-test',
        expect.any(Number),
      );

      const [[, processingTime]] = mockSimulationService.updateProcessingTime.mock.calls;
      expect(processingTime).toBeGreaterThanOrEqual(90);
    });
  });
});
