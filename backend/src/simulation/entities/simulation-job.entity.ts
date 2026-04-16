import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('simulation_jobs')
export class SimulationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'num_particles' })
  numParticles: number;

  @Column()
  steps: number;

  @Column()
  seed: number;

  @Column({ type: 'float', default: 0.01 })
  dt: number;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column({ name: 'output_path', nullable: true })
  outputPath: string;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'processing_time_ms', nullable: true })
  processingTimeMs: number;
}
