import { IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateSimulationDto {
  @IsInt()
  @Min(1)
  @Max(5000)
  numParticles: number;

  @IsInt()
  @Min(1)
  @Max(100000)
  steps: number;

  @IsInt()
  @Min(0)
  seed: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  @Max(1)
  dt?: number;
}
