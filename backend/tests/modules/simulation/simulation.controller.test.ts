import { Test, TestingModule } from '@nestjs/testing';
import { SimulationController } from '../../../src/modules/simulation/simulation.controller';
import { SimulationService } from '../../../src/modules/simulation/simulation.service';
import { CreateSimulationDto } from '../../../src/modules/simulation/dto/create-simulation.dto';
import { NotFoundException } from '@nestjs/common';
import { JobStatus } from '../../../src/modules/simulation/entities/simulation-job.entity';

describe('SimulationController', () => {
  let controller: SimulationController;
  let service: SimulationService;

  const mockSimulationService = {
    createJob: jest.fn(),
    getJob: jest.fn(),
    getAllJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationController],
      providers: [
        {
          provide: SimulationService,
          useValue: mockSimulationService,
        },
      ],
    }).compile();

    controller = module.get<SimulationController>(SimulationController);
    service = module.get<SimulationService>(SimulationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSimulation', () => {
    it('should create a simulation job', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 100,
        steps: 1000,
        seed: 42,
        dt: 0.01,
      };

      const expectedResult = {
        jobId: 'test-job-id',
        status: JobStatus.PENDING,
        createdAt: new Date(),
      };

      mockSimulationService.createJob.mockResolvedValue(expectedResult);

      const result = await controller.createSimulation(dto);

      expect(result).toEqual(expectedResult);
      expect(service.createJob).toHaveBeenCalledWith(dto);
    });

    it('should handle service errors', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 100,
        steps: 1000,
        seed: 42,
      };

      mockSimulationService.createJob.mockRejectedValue(new Error('Database error'));

      await expect(controller.createSimulation(dto)).rejects.toThrow('Database error');
    });
  });

  describe('getSimulation', () => {
    it('should return a simulation job', async () => {
      const jobId = 'test-job-id';
      const expectedJob = {
        id: jobId,
        numParticles: 100,
        steps: 1000,
        seed: 42,
        status: JobStatus.COMPLETED,
        outputPath: '/output/test-job-id/frames.json',
        createdAt: new Date(),
        completedAt: new Date(),
      };

      mockSimulationService.getJob.mockResolvedValue(expectedJob);

      const result = await controller.getSimulation(jobId);

      expect(result).toEqual(expectedJob);
      expect(service.getJob).toHaveBeenCalledWith(jobId);
    });

    it('should throw NotFoundException when job not found', async () => {
      const jobId = 'non-existent-id';

      mockSimulationService.getJob.mockResolvedValue(null);

      await expect(controller.getSimulation(jobId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs', async () => {
      const expectedJobs = [
        {
          id: 'job-1',
          numParticles: 100,
          steps: 1000,
          seed: 42,
          status: JobStatus.COMPLETED,
        },
        {
          id: 'job-2',
          numParticles: 200,
          steps: 500,
          seed: 123,
          status: JobStatus.PENDING,
        },
      ];

      mockSimulationService.getAllJobs.mockResolvedValue(expectedJobs);

      const result = await controller.getAllJobs();

      expect(result).toEqual(expectedJobs);
      expect(service.getAllJobs).toHaveBeenCalled();
    });

    it('should return empty array when no jobs exist', async () => {
      mockSimulationService.getAllJobs.mockResolvedValue([]);

      const result = await controller.getAllJobs();

      expect(result).toEqual([]);
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const jobId = 'test-job-id';
      const completedAt = new Date();
      const createdAt = new Date(Date.now() - 30000);

      const job = {
        id: jobId,
        status: JobStatus.COMPLETED,
        createdAt,
        completedAt,
        processingTimeMs: 30000,
      };

      mockSimulationService.getJob.mockResolvedValue(job);

      const result = await controller.getJobStatus(jobId);

      expect(result).toEqual({
        id: jobId,
        status: JobStatus.COMPLETED,
        createdAt,
        completedAt,
        processingTimeMs: 30000,
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      mockSimulationService.getJob.mockResolvedValue(null);

      await expect(controller.getJobStatus('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
