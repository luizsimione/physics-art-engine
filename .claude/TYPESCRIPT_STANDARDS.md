# TypeScript & NestJS Standards

This document outlines TypeScript and NestJS best practices for the backend API and future frontend.

## TypeScript Configuration

### Compiler Options

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Strict Mode Rules

**All strict checks enabled:**
- `strictNullChecks` - No implicit null/undefined
- `strictFunctionTypes` - Function parameter contravariance
- `strictBindCallApply` - Type-checking for bind/call/apply
- `strictPropertyInitialization` - Class properties must be initialized
- `noImplicitThis` - No implicit any for this
- `noImplicitAny` - No implicit any types

## Type Safety Principles

### 1. Never Use `any`

**❌ Bad:**
```typescript
function processData(data: any) {
  return data.value;  // No type safety
}

const result: any = await fetch('/api/data');
```

**✅ Good:**
```typescript
interface DataPayload {
  value: number;
  timestamp: Date;
}

function processData(data: DataPayload): number {
  return data.value;  // Type-safe
}

const result = await fetch('/api/data');
const data = await result.json() as DataPayload;
```

### 2. Use `unknown` Instead of `any`

**When you truly don't know the type:**

```typescript
// ❌ Bad: any allows anything
function parseJSON(json: string): any {
  return JSON.parse(json);
}

// ✅ Good: unknown requires type checking
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}

// Must narrow the type before use
const result = parseJSON('{"value": 42}');

// Type guard
if (isDataPayload(result)) {
  console.log(result.value);  // Now type-safe
}

function isDataPayload(obj: unknown): obj is DataPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'value' in obj &&
    typeof (obj as any).value === 'number'
  );
}
```

### 3. Prefer Type Inference

**Let TypeScript infer types when obvious:**

```typescript
// ❌ Unnecessary explicit types
const numParticles: number = 100;
const seed: number = 42;
const particles: Array<Particle> = [];

// ✅ Let TypeScript infer
const numParticles = 100;  // Inferred as number
const seed = 42;           // Inferred as number
const particles: Particle[] = [];  // Array syntax is clearer
```

**But be explicit when it helps:**

```typescript
// ✅ Explicit when inference would be wrong
const id: string = generateId();  // Could return string | null

// ✅ Explicit for public APIs
export function createSimulation(config: SimulationConfig): Promise<SimulationJob> {
  // Return type is explicit for consumers
}
```

### 4. Use Discriminated Unions for State

```typescript
// ❌ Bad: Status is just a string
interface JobState {
  status: string;
  error?: string;
  result?: SimulationResult;
}

// ✅ Good: Discriminated union
type JobState =
  | { status: 'pending' }
  | { status: 'processing' }
  | { status: 'completed'; result: SimulationResult }
  | { status: 'failed'; error: string };

// Type-safe handling
function handleJobState(state: JobState) {
  switch (state.status) {
    case 'pending':
      // TypeScript knows no result/error here
      return 'Job is queued';
    
    case 'processing':
      return 'Job is running';
    
    case 'completed':
      // TypeScript knows result is available
      return `Completed: ${state.result.frames.length} frames`;
    
    case 'failed':
      // TypeScript knows error is available
      return `Failed: ${state.error}`;
  }
}
```

### 5. Use Template Literal Types

```typescript
// Define allowed HTTP methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Define allowed paths
type ApiPath = '/generate' | '/art/:id' | '/jobs';

// Construct full routes
type Route = `${HttpMethod} ${ApiPath}`;
// Result: 'GET /generate' | 'POST /generate' | ... (all combinations)

// Use in type-safe way
function makeRequest(route: Route) {
  // Only valid routes allowed
}

makeRequest('GET /generate');  // ✅
makeRequest('GET /invalid');   // ❌ Type error
```

## NestJS Patterns

### Module Organization

```
src/
  ├── app.module.ts              # Root module
  ├── config/                    # Configuration
  │   ├── database.config.ts
  │   └── redis.config.ts
  ├── simulation/                # Feature module
  │   ├── simulation.module.ts
  │   ├── simulation.controller.ts
  │   ├── simulation.service.ts
  │   ├── simulation.processor.ts
  │   ├── entities/
  │   │   └── simulation-job.entity.ts
  │   └── dto/
  │       ├── create-simulation.dto.ts
  │       └── update-simulation.dto.ts
  └── shared/                    # Shared utilities
      ├── guards/
      ├── interceptors/
      └── pipes/
```

### DTOs (Data Transfer Objects)

**Use class-validator for validation:**

```typescript
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
```

**Transform and validate automatically:**

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true,           // Transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true,  // Convert types (string -> number)
    },
  }),
);
```

### Controllers

**Keep controllers thin - delegate to services:**

```typescript
@Controller()
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('generate')
  async createSimulation(@Body() dto: CreateSimulationDto) {
    // ✅ Just validation and delegation
    return this.simulationService.createJob(dto);
  }

  @Get('art/:id')
  async getSimulation(@Param('id') id: string) {
    const job = await this.simulationService.getJob(id);
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return job;
  }
}
```

### Services (Business Logic)

```typescript
@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(
    @InjectRepository(SimulationJob)
    private readonly jobRepository: Repository<SimulationJob>,
    @InjectQueue('simulation')
    private readonly simulationQueue: Queue,
  ) {}

  async createJob(dto: CreateSimulationDto): Promise<JobResponse> {
    // ✅ All business logic here
    this.logger.log(`Creating job: ${dto.numParticles} particles`);

    const job = this.jobRepository.create({
      numParticles: dto.numParticles,
      steps: dto.steps,
      seed: dto.seed,
      dt: dto.dt ?? 0.01,
      status: JobStatus.PENDING,
    });

    const savedJob = await this.jobRepository.save(job);

    await this.simulationQueue.add('process-simulation', {
      jobId: savedJob.id,
      ...dto,
    });

    return {
      jobId: savedJob.id,
      status: savedJob.status,
      createdAt: savedJob.createdAt,
    };
  }
}
```

### Dependency Injection

**Use constructor injection:**

```typescript
// ✅ Good: Constructor injection
@Injectable()
export class SimulationService {
  constructor(
    private readonly jobRepository: Repository<SimulationJob>,
    private readonly simulationQueue: Queue,
    private readonly configService: ConfigService,
  ) {}
}

// ❌ Bad: Property injection (not recommended)
@Injectable()
export class SimulationService {
  @Inject(JOB_REPOSITORY)
  private jobRepository: Repository<SimulationJob>;
}
```

### Error Handling

**Use built-in HTTP exceptions:**

```typescript
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

@Get('art/:id')
async getSimulation(@Param('id') id: string) {
  // Validate input
  if (!isValidUUID(id)) {
    throw new BadRequestException('Invalid job ID format');
  }

  // Check existence
  const job = await this.simulationService.getJob(id);
  if (!job) {
    throw new NotFoundException(`Job ${id} not found`);
  }

  return job;
}
```

**Custom exception filters for specific errors:**

```typescript
@Catch(DatabaseException)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: DatabaseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    response.status(500).json({
      statusCode: 500,
      message: 'Database error occurred',
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Async/Await Patterns

### Always Handle Errors

```typescript
// ❌ Bad: Unhandled promise
async function createJob(dto: CreateSimulationDto) {
  const job = await this.jobRepository.save(dto);
  // If this fails, error propagates uncontrolled
  return job;
}

// ✅ Good: Explicit error handling
async function createJob(dto: CreateSimulationDto) {
  try {
    const job = await this.jobRepository.save(dto);
    return job;
  } catch (error) {
    this.logger.error(`Failed to create job: ${error.message}`);
    throw new InternalServerErrorException('Failed to create simulation job');
  }
}
```

### Use Promise.all for Parallel Operations

```typescript
// ❌ Bad: Sequential when could be parallel
async function getJobDetails(id: string) {
  const job = await this.jobRepository.findOne(id);
  const output = await this.readOutputFile(job.outputPath);
  const stats = await this.getJobStats(id);
  
  return { job, output, stats };
}

// ✅ Good: Parallel when operations are independent
async function getJobDetails(id: string) {
  const [job, output, stats] = await Promise.all([
    this.jobRepository.findOne(id),
    this.readOutputFile(job.outputPath),
    this.getJobStats(id),
  ]);
  
  return { job, output, stats };
}
```

## Type Utilities

### Built-in TypeScript Utilities

```typescript
interface SimulationJob {
  id: string;
  numParticles: number;
  steps: number;
  seed: number;
  status: JobStatus;
  outputPath: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// Partial - all properties optional
type PartialJob = Partial<SimulationJob>;
// { id?: string; numParticles?: number; ... }

// Pick - select specific properties
type JobSummary = Pick<SimulationJob, 'id' | 'status' | 'createdAt'>;
// { id: string; status: JobStatus; createdAt: Date; }

// Omit - exclude specific properties
type JobWithoutDates = Omit<SimulationJob, 'createdAt' | 'completedAt'>;
// { id: string; numParticles: number; ... }

// Required - make all properties required
type RequiredJob = Required<SimulationJob>;
// All properties now non-nullable

// Readonly - make all properties readonly
type ImmutableJob = Readonly<SimulationJob>;
// Can't modify any properties
```

### Custom Type Guards

```typescript
function isSimulationJob(obj: unknown): obj is SimulationJob {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'numParticles' in obj &&
    'status' in obj
  );
}

// Usage
const data: unknown = await fetchData();

if (isSimulationJob(data)) {
  // TypeScript knows data is SimulationJob here
  console.log(data.numParticles);
}
```

## Testing Patterns

### Controller Testing

```typescript
describe('SimulationController', () => {
  let controller: SimulationController;
  let service: SimulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationController],
      providers: [
        {
          provide: SimulationService,
          useValue: {
            createJob: jest.fn(),
            getJob: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SimulationController>(SimulationController);
    service = module.get<SimulationService>(SimulationService);
  });

  describe('createSimulation', () => {
    it('should create a job', async () => {
      const dto: CreateSimulationDto = {
        numParticles: 100,
        steps: 1000,
        seed: 42,
      };

      const expected = {
        jobId: 'test-id',
        status: JobStatus.PENDING,
        createdAt: new Date(),
      };

      jest.spyOn(service, 'createJob').mockResolvedValue(expected);

      const result = await controller.createSimulation(dto);

      expect(result).toEqual(expected);
      expect(service.createJob).toHaveBeenCalledWith(dto);
    });
  });
});
```

### Service Testing

```typescript
describe('SimulationService', () => {
  let service: SimulationService;
  let repository: Repository<SimulationJob>;
  let queue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        {
          provide: getRepositoryToken(SimulationJob),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getQueueToken('simulation'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SimulationService>(SimulationService);
    repository = module.get<Repository<SimulationJob>>(
      getRepositoryToken(SimulationJob),
    );
    queue = module.get<Queue>(getQueueToken('simulation'));
  });

  it('should create a job and add to queue', async () => {
    const dto: CreateSimulationDto = {
      numParticles: 100,
      steps: 1000,
      seed: 42,
    };

    const savedJob = { id: 'test-id', ...dto, status: JobStatus.PENDING };

    jest.spyOn(repository, 'create').mockReturnValue(savedJob as any);
    jest.spyOn(repository, 'save').mockResolvedValue(savedJob as any);
    jest.spyOn(queue, 'add').mockResolvedValue({} as any);

    const result = await service.createJob(dto);

    expect(result.jobId).toBe('test-id');
    expect(queue.add).toHaveBeenCalled();
  });
});
```

## Common Pitfalls

### 1. Forgetting `await`

```typescript
// ❌ Bad: Missing await
const job = this.jobRepository.save(dto);  // Returns Promise!
console.log(job.id);  // undefined

// ✅ Good
const job = await this.jobRepository.save(dto);
console.log(job.id);  // Correct
```

### 2. Not Handling Null/Undefined

```typescript
// ❌ Bad: Assumes job exists
const job = await this.getJob(id);
return job.outputPath;  // Could crash if job is null

// ✅ Good: Check for null
const job = await this.getJob(id);
if (!job) {
  throw new NotFoundException('Job not found');
}
return job.outputPath;

// ✅ Or use optional chaining
return job?.outputPath ?? null;
```

### 3. Mutating Objects

```typescript
// ❌ Bad: Mutating input
function processJob(job: SimulationJob) {
  job.status = JobStatus.PROCESSING;  // Mutates!
  return job;
}

// ✅ Good: Return new object
function processJob(job: SimulationJob): SimulationJob {
  return {
    ...job,
    status: JobStatus.PROCESSING,
  };
}
```

## Summary

**Type Safety:**
- Never use `any`, use `unknown` with type guards
- Prefer type inference for local variables
- Be explicit for public APIs
- Use discriminated unions for state

**NestJS:**
- Thin controllers, fat services
- Use DTOs with class-validator
- Constructor injection for dependencies
- Use built-in HTTP exceptions

**Async:**
- Always handle errors in async functions
- Use Promise.all for parallel operations
- Don't forget await

**Testing:**
- Mock dependencies
- Test behavior, not implementation
- Use TypeScript in tests too

**Remember:** TypeScript is here to help you. If you're fighting the type system, you're probably doing something wrong. Embrace types and let them guide your design.
