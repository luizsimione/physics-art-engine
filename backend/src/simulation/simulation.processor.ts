import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SimulationService } from './simulation.service';
import { JobStatus } from './entities/simulation-job.entity';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

interface SimulationJobData {
  jobId: string;
  numParticles: number;
  steps: number;
  seed: number;
  dt: number;
}

@Processor('simulation')
export class SimulationProcessor extends WorkerHost {
  private readonly logger = new Logger(SimulationProcessor.name);
  private readonly binaryPath: string;
  private readonly outputDir: string;

  constructor(private readonly simulationService: SimulationService) {
    super();
    this.binaryPath = process.env.SIMULATION_BINARY_PATH || '../simulation-engine/sim';
    this.outputDir = process.env.SIMULATION_OUTPUT_DIR || './output';
  }

  async process(job: Job<SimulationJobData>): Promise<any> {
    const { jobId, numParticles, steps, seed, dt } = job.data;

    this.logger.log(`Processing simulation job ${jobId}`);

    const startTime = Date.now();

    try {
      // Update status to processing
      await this.simulationService.updateJobStatus(jobId, JobStatus.PROCESSING);

      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Create job-specific directory
      const jobOutputDir = path.join(this.outputDir, jobId);
      await fs.mkdir(jobOutputDir, { recursive: true });

      const outputFile = path.join(jobOutputDir, 'frames.json');

      // Run simulation
      await this.runSimulation(numParticles, steps, seed, dt, outputFile);

      const processingTime = Date.now() - startTime;

      // Update job status to completed
      await this.simulationService.updateJobStatus(jobId, JobStatus.COMPLETED, outputFile);

      await this.simulationService.updateProcessingTime(jobId, processingTime);

      this.logger.log(`Job ${jobId} completed in ${processingTime}ms. Output: ${outputFile}`);

      return { success: true, outputFile, processingTime };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);

      await this.simulationService.updateJobStatus(jobId, JobStatus.FAILED, null, error.message);

      await this.simulationService.updateProcessingTime(jobId, processingTime);

      throw error;
    }
  }

  private runSimulation(
    numParticles: number,
    steps: number,
    seed: number,
    dt: number,
    outputFile: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '--particles',
        numParticles.toString(),
        '--steps',
        steps.toString(),
        '--seed',
        seed.toString(),
        '--dt',
        dt.toString(),
        '--mode',
        'batch',
      ];

      this.logger.debug(`Running: ${this.binaryPath} ${args.join(' ')}`);

      const process = spawn(this.binaryPath, args);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        this.logger.warn(`Simulation stderr: ${data}`);
      });

      process.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`Simulation process exited with code ${code}. stderr: ${stderr}`));
          return;
        }

        try {
          // Write output to file
          await fs.writeFile(outputFile, stdout, 'utf-8');
          resolve();
        } catch (err) {
          reject(new Error(`Failed to write output file: ${err.message}`));
        }
      });

      process.on('error', (err) => {
        reject(new Error(`Failed to start simulation process: ${err.message}`));
      });
    });
  }
}
