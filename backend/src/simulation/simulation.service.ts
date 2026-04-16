import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { SimulationJob, JobStatus } from './entities/simulation-job.entity';
import { CreateSimulationDto } from './dto/create-simulation.dto';

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(
    @InjectRepository(SimulationJob)
    private readonly jobRepository: Repository<SimulationJob>,
    @InjectQueue('simulation')
    private readonly simulationQueue: Queue,
  ) {}

  async createJob(createSimulationDto: CreateSimulationDto) {
    this.logger.log(
      `Creating simulation job: ${createSimulationDto.numParticles} particles, ${createSimulationDto.steps} steps`,
    );

    // Create job entity
    const job = this.jobRepository.create({
      numParticles: createSimulationDto.numParticles,
      steps: createSimulationDto.steps,
      seed: createSimulationDto.seed,
      dt: createSimulationDto.dt || 0.01,
      status: JobStatus.PENDING,
    });

    const savedJob = await this.jobRepository.save(job);

    // Add to queue
    await this.simulationQueue.add(
      'process-simulation',
      {
        jobId: savedJob.id,
        numParticles: savedJob.numParticles,
        steps: savedJob.steps,
        seed: savedJob.seed,
        dt: savedJob.dt,
      },
      {
        jobId: savedJob.id,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(`Job ${savedJob.id} added to queue`);

    return {
      jobId: savedJob.id,
      status: savedJob.status,
      createdAt: savedJob.createdAt,
    };
  }

  async getJob(id: string): Promise<SimulationJob> {
    return this.jobRepository.findOne({ where: { id } });
  }

  async getAllJobs(): Promise<SimulationJob[]> {
    return this.jobRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async updateJobStatus(id: string, status: JobStatus, outputPath?: string, errorMessage?: string) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === JobStatus.COMPLETED) {
      updateData.completedAt = new Date();
      updateData.outputPath = outputPath;
    } else if (status === JobStatus.FAILED) {
      updateData.errorMessage = errorMessage;
    }

    await this.jobRepository.update(id, updateData);

    this.logger.log(`Job ${id} status updated to ${status}`);
  }

  async updateProcessingTime(id: string, processingTimeMs: number) {
    await this.jobRepository.update(id, { processingTimeMs });
  }
}
