import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';

@Controller()
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('generate')
  async createSimulation(@Body() createSimulationDto: CreateSimulationDto) {
    return this.simulationService.createJob(createSimulationDto);
  }

  @Get('art/:id')
  async getSimulation(@Param('id') id: string) {
    const job = await this.simulationService.getJob(id);
    if (!job) {
      throw new NotFoundException(`Simulation job with ID ${id} not found`);
    }
    return job;
  }

  @Get('jobs')
  async getAllJobs() {
    return this.simulationService.getAllJobs();
  }

  @Get('jobs/:id/status')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.simulationService.getJob(id);
    if (!job) {
      throw new NotFoundException(`Simulation job with ID ${id} not found`);
    }
    return {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      processingTimeMs: job.processingTimeMs,
    };
  }
}
