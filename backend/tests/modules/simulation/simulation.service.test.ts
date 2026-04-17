import { Test, TestingModule } from '@nestjs/testing';
import { SimulationService } from '../../../src/modules/simulation/simulation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import {
  SimulationJob,
  JobStatus,
} from '../../../src/modules/simulation/entities/simulation-job.entity';
import { CreateSimulationDto } from '../../../src/modules/simulation/dto/create-simulation.dto';

describe('SimulationService', () => {
  let service: SimulationService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        {
          provide: getRepositoryToken(SimulationJob),
          useValue: mockRepository,
        },
        {
          provide: getQueueToken('simulation'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<SimulationService>(SimulationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJob', () => {
    it('should create and queue a simulation job with default dt', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 50,
        steps: 100,
        seed: 42,
      };

      const mockJob = {
        id: 'test-uuid',
        numParticles: 50,
        steps: 100,
        seed: 42,
        dt: 0.01,
        status: JobStatus.PENDING,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockJob);
      mockRepository.save.mockResolvedValue(mockJob);
      mockQueue.add.mockResolvedValue({});

      const result = await service.createJob(dto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        numParticles: 50,
        steps: 100,
        seed: 42,
        dt: 0.01,
        status: JobStatus.PENDING,
      });

      expect(mockRepository.save).toHaveBeenCalledWith(mockJob);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-simulation',
        {
          jobId: 'test-uuid',
          numParticles: 50,
          steps: 100,
          seed: 42,
          dt: 0.01,
        },
        {
          jobId: 'test-uuid',
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      expect(result).toEqual({
        jobId: 'test-uuid',
        status: JobStatus.PENDING,
        createdAt: mockJob.createdAt,
      });
    });

    it('should create job with custom dt value', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 100,
        steps: 200,
        seed: 123,
        dt: 0.02,
      };

      const mockJob = {
        id: 'test-uuid-2',
        ...dto,
        status: JobStatus.PENDING,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockJob);
      mockRepository.save.mockResolvedValue(mockJob);
      mockQueue.add.mockResolvedValue({});

      await service.createJob(dto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        numParticles: 100,
        steps: 200,
        seed: 123,
        dt: 0.02,
        status: JobStatus.PENDING,
      });
    });

    it('should handle database save errors', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 50,
        steps: 100,
        seed: 42,
      };

      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.createJob(dto)).rejects.toThrow('Database connection failed');
    });

    it('should handle queue add errors', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 50,
        steps: 100,
        seed: 42,
      };

      const mockJob = {
        id: 'test-uuid',
        ...dto,
        dt: 0.01,
        status: JobStatus.PENDING,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockJob);
      mockRepository.save.mockResolvedValue(mockJob);
      mockQueue.add.mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.createJob(dto)).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getJob', () => {
    it('should retrieve a job by id', async () => {
      const jobId = 'test-uuid';
      const mockJob = {
        id: jobId,
        numParticles: 50,
        steps: 100,
        seed: 42,
        dt: 0.01,
        status: JobStatus.COMPLETED,
        outputPath: '/output/test-uuid/frames.json',
        createdAt: new Date(),
        completedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockJob);

      const result = await service.getJob(jobId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: jobId } });
      expect(result).toEqual(mockJob);
    });

    it('should return null for non-existent job', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getJob('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getAllJobs', () => {
    it('should retrieve all jobs ordered by creation date', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          numParticles: 50,
          steps: 100,
          seed: 42,
          status: JobStatus.COMPLETED,
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'job-2',
          numParticles: 100,
          steps: 200,
          seed: 123,
          status: JobStatus.PENDING,
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockJobs);

      const result = await service.getAllJobs();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 100,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return empty array when no jobs exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAllJobs();

      expect(result).toEqual([]);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to processing', async () => {
      const jobId = 'test-uuid';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateJobStatus(jobId, JobStatus.PROCESSING);

      expect(mockRepository.update).toHaveBeenCalledWith(jobId, {
        status: JobStatus.PROCESSING,
        updatedAt: expect.any(Date),
      });
    });

    it('should update job status to completed with output path', async () => {
      const jobId = 'test-uuid';
      const outputPath = '/output/test-uuid/frames.json';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateJobStatus(jobId, JobStatus.COMPLETED, outputPath);

      expect(mockRepository.update).toHaveBeenCalledWith(jobId, {
        status: JobStatus.COMPLETED,
        updatedAt: expect.any(Date),
        completedAt: expect.any(Date),
        outputPath: outputPath,
      });
    });

    it('should update job status to failed with error message', async () => {
      const jobId = 'test-uuid';
      const errorMessage = 'Simulation process crashed';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateJobStatus(jobId, JobStatus.FAILED, null, errorMessage);

      expect(mockRepository.update).toHaveBeenCalledWith(jobId, {
        status: JobStatus.FAILED,
        updatedAt: expect.any(Date),
        errorMessage: errorMessage,
      });
    });

    it('should handle update errors', async () => {
      const jobId = 'test-uuid';
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.updateJobStatus(jobId, JobStatus.COMPLETED)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updateProcessingTime', () => {
    it('should update job processing time', async () => {
      const jobId = 'test-uuid';
      const processingTime = 1234;
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateProcessingTime(jobId, processingTime);

      expect(mockRepository.update).toHaveBeenCalledWith(jobId, {
        processingTimeMs: processingTime,
      });
    });

    it('should handle processing time update errors', async () => {
      const jobId = 'test-uuid';
      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateProcessingTime(jobId, 1000)).rejects.toThrow('Update failed');
    });
  });

  describe('edge cases', () => {
    it('should handle very large particle counts', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 10000,
        steps: 1000,
        seed: 42,
      };

      const mockJob = {
        id: 'test-uuid',
        ...dto,
        dt: 0.01,
        status: JobStatus.PENDING,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockJob);
      mockRepository.save.mockResolvedValue(mockJob);
      mockQueue.add.mockResolvedValue({});

      const result = await service.createJob(dto);

      expect(result.jobId).toBe('test-uuid');
    });

    it('should handle zero seed value', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 50,
        steps: 100,
        seed: 0,
      };

      const mockJob = {
        id: 'test-uuid',
        ...dto,
        dt: 0.01,
        status: JobStatus.PENDING,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockJob);
      mockRepository.save.mockResolvedValue(mockJob);
      mockQueue.add.mockResolvedValue({});

      await service.createJob(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({ seed: 0 }));
    });

    it('should handle very small dt values', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 50,
        steps: 100,
        seed: 42,
        dt: 0.0001,
      };

      const mockJob = {
        id: 'test-uuid',
        ...dto,
        status: JobStatus.PENDING,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockJob);
      mockRepository.save.mockResolvedValue(mockJob);
      mockQueue.add.mockResolvedValue({});

      await service.createJob(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({ dt: 0.0001 }));
    });
  });
});
