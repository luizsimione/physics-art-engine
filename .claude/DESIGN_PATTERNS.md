# Design Patterns (Gang of Four)

This document explains how we use classic design patterns from the Gang of Four (GoF) book across our codebase. Each pattern includes: intent, motivation, implementation, and where we use it.

## Creational Patterns

### Factory Method

**Intent:** Define an interface for creating an object, but let subclasses decide which class to instantiate.

**Where We Use It:**

#### 1. Simulation Process Creation (Backend)

```typescript
// SimulationProcessor.ts
class SimulationProcessor {
  private createSimulationProcess(params: SimulationParams): ChildProcess {
    const args = this.buildArgs(params);
    
    // Factory method - creates different process configurations
    if (params.mode === 'stream') {
      return this.createStreamingProcess(args);
    } else {
      return this.createBatchProcess(args);
    }
  }
  
  private createStreamingProcess(args: string[]): ChildProcess {
    // Streaming-specific configuration
    return spawn(this.binaryPath, args, {
      stdio: ['ignore', 'pipe', 'pipe']  // Stream stdout
    });
  }
  
  private createBatchProcess(args: string[]): ChildProcess {
    // Batch-specific configuration
    return spawn(this.binaryPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024  // Large buffer for full output
    });
  }
}
```

**Why:** Different modes need different process configurations. Factory method encapsulates this logic.

#### 2. Particle Initialization (C++)

```cpp
// simulation.cpp
class ParticleFactory {
public:
    static Particle createRandom(std::mt19937& rng) {
        std::uniform_real_distribution<double> posDist(-5.0, 5.0);
        std::uniform_real_distribution<double> velDist(-0.5, 0.5);
        std::uniform_real_distribution<double> massDist(0.5, 2.0);
        
        return Particle(
            Vector2D(posDist(rng), posDist(rng)),
            Vector2D(velDist(rng), velDist(rng)),
            massDist(rng)
        );
    }
    
    static Particle createStationary(Vector2D position, double mass) {
        return Particle(position, Vector2D(0, 0), mass);
    }
};
```

**Why:** Encapsulates particle creation logic, makes it easy to add new creation strategies.

---

### Builder Pattern

**Intent:** Separate the construction of a complex object from its representation.

**Where We Use It:**

#### Simulation Configuration (Future Enhancement)

```typescript
// simulation-builder.ts
class SimulationBuilder {
  private config: Partial<SimulationConfig> = {};
  
  withParticles(num: number): this {
    this.config.numParticles = num;
    return this;
  }
  
  withSteps(steps: number): this {
    this.config.steps = steps;
    return this;
  }
  
  withSeed(seed: number): this {
    this.config.seed = seed;
    return this;
  }
  
  asStreaming(): this {
    this.config.mode = 'stream';
    return this;
  }
  
  asBatch(): this {
    this.config.mode = 'batch';
    return this;
  }
  
  build(): SimulationConfig {
    // Validation
    if (!this.config.numParticles || !this.config.steps) {
      throw new Error('Missing required parameters');
    }
    
    return {
      numParticles: this.config.numParticles,
      steps: this.config.steps,
      seed: this.config.seed ?? Math.floor(Math.random() * 1000000),
      dt: this.config.dt ?? 0.01,
      mode: this.config.mode ?? 'batch'
    };
  }
}

// Usage
const config = new SimulationBuilder()
  .withParticles(100)
  .withSteps(1000)
  .withSeed(42)
  .asStreaming()
  .build();
```

**Why:** Complex configuration with many optional parameters. Builder makes it fluent and type-safe.

---

## Structural Patterns

### Adapter Pattern

**Intent:** Convert the interface of a class into another interface clients expect.

**Where We Use It:**

#### C++ Process to TypeScript Promise

```typescript
// process-adapter.ts
class SimulationProcessAdapter {
  async execute(config: SimulationConfig): Promise<SimulationResult> {
    // Adapt child_process (callback-based) to Promise (async/await)
    return new Promise((resolve, reject) => {
      const process = spawn(binaryPath, args);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => stdout += data);
      process.stderr.on('data', (data) => stderr += data);
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ output: JSON.parse(stdout) });
        } else {
          reject(new Error(`Process failed: ${stderr}`));
        }
      });
    });
  }
}
```

**Why:** C++ process uses stdio streams and exit codes. TypeScript code expects Promises. Adapter bridges them.

#### JSON Output Adapter (C++)

```cpp
// json-adapter.cpp
class JSONAdapter {
public:
    static std::string toJSON(const Particle& p) {
        std::ostringstream oss;
        oss << "{"
            << "\"x\":" << p.position.x << ","
            << "\"y\":" << p.position.y << ","
            << "\"vx\":" << p.velocity.x << ","
            << "\"vy\":" << p.velocity.y << ","
            << "\"mass\":" << p.mass
            << "}";
        return oss.str();
    }
    
    static std::string toJSON(const std::vector<Particle>& particles, int frame) {
        std::ostringstream oss;
        oss << "{\"frame\":" << frame << ",\"particles\":[";
        for (size_t i = 0; i < particles.size(); ++i) {
            if (i > 0) oss << ",";
            oss << toJSON(particles[i]);
        }
        oss << "]}";
        return oss.str();
    }
};
```

**Why:** Simulation engine works with C++ objects. Other services need JSON. Adapter converts formats.

---

### Proxy Pattern

**Intent:** Provide a surrogate or placeholder for another object to control access to it.

**Where We Use It:**

#### Database Access Proxy (Repository Pattern)

```typescript
// simulation-repository.ts
@Injectable()
export class SimulationRepository {
  constructor(
    @InjectRepository(SimulationJob)
    private readonly jobRepository: Repository<SimulationJob>
  ) {}
  
  // Proxy to database with additional logic
  async findById(id: string): Promise<SimulationJob | null> {
    // Could add caching here
    // Could add logging here
    // Could add access control here
    return this.jobRepository.findOne({ where: { id } });
  }
  
  async save(job: SimulationJob): Promise<SimulationJob> {
    // Could add validation here
    // Could add audit logging here
    return this.jobRepository.save(job);
  }
}
```

**Why:** Isolates database access, allows adding cross-cutting concerns (caching, logging, validation).

#### Virtual Proxy (Lazy Loading)

```typescript
// lazy-simulation-loader.ts
class SimulationDataProxy {
  private data: SimulationResult | null = null;
  
  async getData(): Promise<SimulationResult> {
    // Lazy load - only load when accessed
    if (!this.data) {
      console.log('Loading simulation data...');
      const file = await fs.readFile(this.outputPath, 'utf-8');
      this.data = JSON.parse(file);
    }
    return this.data;
  }
}
```

**Why:** Large simulation outputs shouldn't be loaded until needed. Proxy handles lazy loading.

---

## Behavioral Patterns

### Strategy Pattern

**Intent:** Define a family of algorithms, encapsulate each one, and make them interchangeable.

**Where We Use It:**

#### 1. Output Mode Strategy (C++)

```cpp
// output-strategy.h
class OutputStrategy {
public:
    virtual ~OutputStrategy() = default;
    virtual void output(int frame, const std::vector<Particle>& particles) = 0;
    virtual void finalize() = 0;
};

class StreamingOutputStrategy : public OutputStrategy {
public:
    void output(int frame, const std::vector<Particle>& particles) override {
        // Output immediately to stdout
        std::cout << toJSON(frame, particles) << std::endl;
    }
    
    void finalize() override {
        // Nothing to do
    }
};

class BatchOutputStrategy : public OutputStrategy {
private:
    std::vector<std::string> frames;
    
public:
    void output(int frame, const std::vector<Particle>& particles) override {
        // Accumulate frames
        frames.push_back(toJSON(frame, particles));
    }
    
    void finalize() override {
        // Output all frames as JSON array
        std::cout << "[";
        for (size_t i = 0; i < frames.size(); ++i) {
            if (i > 0) std::cout << ",";
            std::cout << frames[i];
        }
        std::cout << "]" << std::endl;
    }
};

// Simulation uses strategy
class Simulation {
private:
    std::unique_ptr<OutputStrategy> outputStrategy;
    
public:
    void setOutputStrategy(std::unique_ptr<OutputStrategy> strategy) {
        outputStrategy = std::move(strategy);
    }
    
    void run(int steps, double dt) {
        for (int frame = 0; frame < steps; ++frame) {
            step(dt);
            outputStrategy->output(frame, particles);
        }
        outputStrategy->finalize();
    }
};
```

**Why:** Different output modes have completely different logic. Strategy encapsulates this variation.

#### 2. Visualization Mode Strategy (Future - Frontend)

```typescript
// visualization-strategy.ts
interface VisualizationStrategy {
  render(frame: SimulationFrame, scene: THREE.Scene): void;
}

class WaveformStrategy implements VisualizationStrategy {
  render(frame: SimulationFrame, scene: THREE.Scene): void {
    // Plot X-position over time
    frame.particles.forEach((p, i) => {
      // Create waveform visualization
    });
  }
}

class VectorScopeStrategy implements VisualizationStrategy {
  render(frame: SimulationFrame, scene: THREE.Scene): void {
    // Plot X vs Y (Lissajous patterns)
    frame.particles.forEach((p, i) => {
      // Create vector scope visualization
    });
  }
}

class MultiChannelStrategy implements VisualizationStrategy {
  render(frame: SimulationFrame, scene: THREE.Scene): void {
    // Multiple stacked particle traces
    frame.particles.forEach((p, i) => {
      // Create multi-channel visualization
    });
  }
}

// Renderer uses strategy
class OscilloscopeRenderer {
  private strategy: VisualizationStrategy;
  
  setStrategy(strategy: VisualizationStrategy): void {
    this.strategy = strategy;
  }
  
  render(frame: SimulationFrame): void {
    this.strategy.render(frame, this.scene);
  }
}
```

**Why:** User can switch between different visualization modes. Strategy makes this swappable at runtime.

---

### Observer Pattern

**Intent:** Define a one-to-many dependency so when one object changes state, all dependents are notified.

**Where We Use It:**

#### 1. WebSocket Event Streaming

```typescript
// stream-gateway.ts
@WebSocketGateway()
export class StreamGateway {
  @WebSocketServer()
  server: Server;
  
  private observers = new Map<string, Socket>();
  
  // Register observer (client connection)
  handleConnection(client: Socket) {
    this.observers.set(client.id, client);
    console.log(`Observer registered: ${client.id}`);
  }
  
  handleDisconnect(client: Socket) {
    this.observers.delete(client.id);
    console.log(`Observer unregistered: ${client.id}`);
  }
  
  // Subject notifies all observers
  notifyFrame(frame: SimulationFrame) {
    this.observers.forEach((observer) => {
      observer.emit('frame', frame);
    });
  }
  
  @SubscribeMessage('start-stream')
  async handleStream(client: Socket, payload: StreamRequest) {
    const process = this.spawnSimulation(payload);
    
    // Read from C++ process and notify observers
    process.stdout.on('data', (data) => {
      const frame = JSON.parse(data.toString());
      this.notifyFrame(frame);  // Notify all observers
    });
  }
}
```

**Why:** Multiple clients can watch the same simulation. Observer pattern manages the one-to-many relationship.

#### 2. Job Status Updates

```typescript
// job-observer.ts
interface JobObserver {
  onJobUpdated(job: SimulationJob): void;
}

class JobSubject {
  private observers: JobObserver[] = [];
  
  attach(observer: JobObserver): void {
    this.observers.push(observer);
  }
  
  detach(observer: JobObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) this.observers.splice(index, 1);
  }
  
  notify(job: SimulationJob): void {
    this.observers.forEach((observer) => {
      observer.onJobUpdated(job);
    });
  }
}

// Logging observer
class LoggingObserver implements JobObserver {
  onJobUpdated(job: SimulationJob): void {
    console.log(`Job ${job.id} status: ${job.status}`);
  }
}

// Metrics observer
class MetricsObserver implements JobObserver {
  onJobUpdated(job: SimulationJob): void {
    // Send metrics to monitoring system
    this.metricsClient.increment('job.status', {
      status: job.status
    });
  }
}
```

**Why:** Multiple systems (logging, metrics, notifications) need to know about job updates. Observer decouples them.

---

### Command Pattern

**Intent:** Encapsulate a request as an object, allowing parameterization and queuing of requests.

**Where We Use It:**

#### BullMQ Job Queue

```typescript
// simulation-commands.ts
interface SimulationCommand {
  jobId: string;
  numParticles: number;
  steps: number;
  seed: number;
  dt: number;
}

// Command sender (enqueue)
class SimulationService {
  async createJob(dto: CreateSimulationDto): Promise<void> {
    const command: SimulationCommand = {
      jobId: generateId(),
      numParticles: dto.numParticles,
      steps: dto.steps,
      seed: dto.seed,
      dt: dto.dt ?? 0.01
    };
    
    // Enqueue command
    await this.queue.add('process-simulation', command, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }
}

// Command receiver (dequeue and execute)
@Processor('simulation')
class SimulationProcessor {
  async process(job: Job<SimulationCommand>): Promise<void> {
    const command = job.data;
    
    // Execute command
    await this.runSimulation(
      command.numParticles,
      command.steps,
      command.seed,
      command.dt
    );
  }
}
```

**Why:** Jobs are commands that can be queued, retried, prioritized, and executed asynchronously. Command pattern makes this explicit.

---

### Template Method

**Intent:** Define the skeleton of an algorithm, letting subclasses override specific steps.

**Where We Use It:**

#### Simulation Processing Pipeline

```typescript
// simulation-processor-base.ts
abstract class SimulationProcessorBase {
  // Template method defines the algorithm
  async process(job: Job<SimulationCommand>): Promise<SimulationResult> {
    await this.beforeSimulation(job);
    
    const result = await this.runSimulation(job.data);
    
    await this.afterSimulation(job, result);
    
    return result;
  }
  
  // Hook methods - subclasses can override
  protected async beforeSimulation(job: Job): Promise<void> {
    // Default: do nothing
  }
  
  protected abstract runSimulation(params: SimulationCommand): Promise<SimulationResult>;
  
  protected async afterSimulation(job: Job, result: SimulationResult): Promise<void> {
    // Default: do nothing
  }
}

// Concrete implementation
class StandardSimulationProcessor extends SimulationProcessorBase {
  protected async beforeSimulation(job: Job): Promise<void> {
    console.log(`Starting simulation ${job.id}`);
    await this.updateJobStatus(job.id, 'processing');
  }
  
  protected async runSimulation(params: SimulationCommand): Promise<SimulationResult> {
    // Spawn C++ process and capture output
    return this.spawnAndCapture(params);
  }
  
  protected async afterSimulation(job: Job, result: SimulationResult): Promise<void> {
    await this.saveOutput(job.id, result);
    await this.updateJobStatus(job.id, 'completed');
    console.log(`Completed simulation ${job.id}`);
  }
}
```

**Why:** Processing pipeline has fixed steps, but implementations vary. Template method provides structure while allowing customization.

---

### State Pattern

**Intent:** Allow an object to alter its behavior when its internal state changes.

**Where We Use It:**

#### Job State Machine (Future Enhancement)

```typescript
// job-states.ts
interface JobState {
  start: () => void;
  pause: () => void;
  resume: () => void;
  complete: () => void;
  fail: (error: string) => void;
}

class PendingState implements JobState {
  constructor(private context: SimulationJob) {}
  
  start(): void {
    this.context.setState(new ProcessingState(this.context));
    this.context.status = 'processing';
  }
  
  pause(): void {
    throw new Error('Cannot pause pending job');
  }
  
  resume(): void {
    throw new Error('Cannot resume pending job');
  }
  
  complete(): void {
    throw new Error('Cannot complete pending job');
  }
  
  fail(error: string): void {
    this.context.setState(new FailedState(this.context));
    this.context.status = 'failed';
    this.context.errorMessage = error;
  }
}

class ProcessingState implements JobState {
  // ... implements valid transitions from processing state
}

class SimulationJob {
  private state: JobState;
  status: string;
  errorMessage?: string;
  
  constructor() {
    this.state = new PendingState(this);
    this.status = 'pending';
  }
  
  setState(state: JobState): void {
    this.state = state;
  }
  
  // Delegate to current state
  start(): void { this.state.start(); }
  pause(): void { this.state.pause(); }
  resume(): void { this.state.resume(); }
  complete(): void { this.state.complete(); }
  fail(error: string): void { this.state.fail(error); }
}
```

**Why:** Job lifecycle has complex state transitions. State pattern makes valid transitions explicit and type-safe.

---

## Summary of Patterns Used

| Pattern | Where Used | Why |
|---------|-----------|-----|
| **Factory Method** | Process creation, particle initialization | Encapsulates object creation logic |
| **Builder** | Simulation configuration | Fluent API for complex objects |
| **Adapter** | C++ to TypeScript, JSON serialization | Bridge incompatible interfaces |
| **Proxy** | Database access, lazy loading | Control access, add behavior |
| **Strategy** | Output modes, visualization modes | Swap algorithms at runtime |
| **Observer** | WebSocket streaming, job updates | One-to-many notifications |
| **Command** | BullMQ jobs | Encapsulate requests, enable queuing |
| **Template Method** | Processing pipeline | Define algorithm skeleton |
| **State** | Job lifecycle | Manage complex state transitions |

## When to Use Design Patterns

**✅ Use patterns when:**
- You have recurring design problems
- You need flexibility for future changes
- You want to communicate design intent clearly
- The pattern simplifies complex logic

**❌ Don't use patterns when:**
- They add unnecessary complexity
- The problem is simple and direct
- You're forcing a pattern where it doesn't fit
- You can't explain why it's needed

**Remember:** Patterns are tools, not goals. Use them to solve problems, not to show off.

## Further Reading

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns) (Gang of Four)
- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [Source Making - Design Patterns](https://sourcemaking.com/design_patterns)
