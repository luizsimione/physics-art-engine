import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { SimulationProcessor } from './simulation.processor';
import { SimulationJob } from './entities/simulation-job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SimulationJob]),
    BullModule.registerQueue({
      name: 'simulation',
    }),
  ],
  controllers: [SimulationController],
  providers: [SimulationService, SimulationProcessor],
  exports: [SimulationService],
})
export class SimulationModule {}
