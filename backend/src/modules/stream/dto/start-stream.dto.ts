import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class StartStreamDto {
  @IsInt()
  @Min(1)
  @Max(1000)
  numParticles: number;

  @IsInt()
  @Min(1)
  @Max(100000)
  @IsOptional()
  steps?: number = 10000;

  @IsInt()
  @Min(0)
  @IsOptional()
  seed?: number;

  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  fps?: number = 30;

  @IsOptional()
  @Min(0.001)
  @Max(0.1)
  dt?: number = 0.01;
}
