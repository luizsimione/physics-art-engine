# System Architecture

This document explains the overall system design, why services are separated, how they communicate, and the tradeoffs we made.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Frontend (Port 3000)                         │   │
│  │  - Three.js oscilloscope visualization              │   │
│  │  - WebSocket client for real-time streaming         │   │
│  │  - REST API client for batch jobs                   │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────┬───────────────┘
             │ HTTP/REST                      │ WebSocket
             │                                │
┌────────────▼────────────────────────────────▼───────────────┐
│                  NestJS Backend (Port 3001)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  REST Controllers                                     │  │
│  │  - POST /generate (create job)                       │  │
│  │  - GET /art/:id (retrieve results)                   │  │
│  │  - GET /jobs (list jobs)                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WebSocket Gateway                                    │  │
│  │  - Real-time frame streaming                         │  │
│  │  - Client connection management                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Simulation Service                                   │  │
│  │  - Spawns C++ processes                              │  │
│  │  - Manages I/O streams                               │  │
│  │  - Parses JSON output                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BullMQ Processor                                     │  │
│  │  - Job queue consumer                                │  │
│  │  - Retry logic and error handling                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────┬─────────────────┬──────────────────┬────────────────┘
       │ Process spawn   │ Queue ops        │ DB access
       │                 │                  │
┌──────▼─────────┐  ┌────▼───────┐  ┌──────▼──────────┐
│                │  │            │  │                 │
│  C++ Engine    │  │   Redis    │  │   PostgreSQL    │
│  (simulation)  │  │  (BullMQ)  │  │   (metadata)    │
│                │  │            │  │                 │
│  - N-body sim  │  │  - Queues  │  │  - Job records  │
│  - CLI args    │  │  - Jobs    │  │  - Status       │
│  - JSON output │  │  - Retry   │  │  - Output paths │
│                │  │            │  │                 │
└────────────────┘  └────────────┘  └─────────────────┘
```

## Service Boundaries

### Why Separate Services?

#### C++ Simulation Engine (simulation-engine/)

**Purpose:** Pure computational physics

**Why separate?**
- **Performance**: C++ is 10-100x faster than JavaScript for numerical computation
- **Portability**: Can be used standalone, in other languages, or on different machines
- **Safety**: Process isolation - if simulation crashes, backend stays up
- **Scalability**: Easy to distribute to compute workers later

**Tradeoffs:**
- ✅ Maximum performance for N-body calculations
- ✅ Can be run independently for testing
- ✅ Process isolation prevents crashes from affecting backend
- ❌ Inter-process communication overhead (process spawn, stdio parsing)
- ❌ More complex deployment (two binaries)
- ❌ Data serialization cost (JSON output)

**Alternative considered:** Node.js native addon (N-API)
- Would eliminate process spawn overhead
- But: harder to debug, crashes can crash Node.js, harder to develop

#### NestJS Backend (backend/)

**Purpose:** Orchestration, I/O, user-facing API

**Why Node.js/NestJS?**
- **I/O optimization**: Node.js excels at handling many concurrent I/O operations (HTTP, WebSocket, DB, Redis)
- **TypeScript**: Type-safe API layer, shared types with frontend
- **Ecosystem**: Rich libraries for WebSockets, job queues, databases
- **Developer experience**: Fast iteration, hot reload, excellent debugging

**Tradeoffs:**
- ✅ Excellent for I/O-bound operations (API requests, database queries, WebSocket connections)
- ✅ Rich ecosystem (BullMQ, TypeORM, Socket.IO)
- ✅ Fast development iteration
- ❌ Poor performance for CPU-intensive computation (why we use C++)
- ❌ Single-threaded (but that's fine for I/O-bound work)

**Alternative considered:** Python FastAPI
- Would integrate better with future ML service
- But: Slower for I/O operations, less mature TypeScript ecosystem

#### PostgreSQL Database

**Purpose:** Job metadata, status tracking, audit trail

**Why PostgreSQL vs alternatives?**
- **ACID transactions**: Critical for job status consistency
- **Rich querying**: Complex queries for job history, filtering
- **Reliability**: Battle-tested for production workloads

**What we DON'T store:**
- Simulation output data (too large, use filesystem)
- Session state (Redis is better for this)
- Real-time streaming data (in-memory only)

**Tradeoffs:**
- ✅ Reliable, ACID-compliant
- ✅ Rich query capabilities
- ✅ Good for structured metadata
- ❌ Overkill for simple key-value lookups (use Redis)
- ❌ Not suitable for large binary data (use filesystem)

#### Redis + BullMQ

**Purpose:** Job queue, async task processing

**Why a queue?**
- **Decoupling**: API responds immediately, work happens asynchronously
- **Retry logic**: Automatic retry for transient failures
- **Rate limiting**: Control how many simulations run concurrently
- **Priority**: Support urgent vs. batch jobs (future)

**Why not just async in backend?**
- No persistence - if backend crashes, in-flight jobs are lost
- No retries - network errors kill the job
- No monitoring - can't track job progress
- No rate limiting - could spawn 1000 simulations simultaneously

**Tradeoffs:**
- ✅ Reliable async processing with retry
- ✅ Survives backend restarts
- ✅ Built-in monitoring and job tracking
- ❌ Additional infrastructure dependency
- ❌ Slightly more complex error handling
- ❌ Network calls add latency (negligible for long-running jobs)

**Alternative considered:** In-memory queue
- Simpler, fewer dependencies
- But: Jobs lost on restart, no persistence, no retry

## Communication Patterns

### REST API (Batch Mode)

**Flow:**
```
Client → POST /generate → NestJS → BullMQ → Queue
                            ↓
                        PostgreSQL (create job record)
                            ↓
                        return { jobId, status: "pending" }

Queue → Worker → Spawn C++ → Wait for completion → Save output → Update DB

Client → GET /art/:id → NestJS → PostgreSQL → return job + output path
```

**When to use:**
- User doesn't need immediate results
- Long-running simulations (>30 seconds)
- Want to retrieve results later

**Tradeoffs:**
- ✅ Reliable with retry logic
- ✅ Survives restarts
- ✅ Can poll for progress
- ❌ Higher latency (must poll for completion)
- ❌ More complex (queue, database)

### WebSocket Streaming (Real-time Mode)

**Flow:**
```
Client → WebSocket connect → NestJS Gateway
                                ↓
                            Spawn C++ (stream mode)
                                ↓
                            Read stdout line-by-line
                                ↓
                            Parse JSON frame
                                ↓
                            Emit to client
                                ↓
                            Client renders in Three.js
```

**When to use:**
- User wants to watch in real-time
- Interactive parameter tweaking
- Shorter simulations (<30 seconds)

**Tradeoffs:**
- ✅ Immediate visual feedback
- ✅ Lower perceived latency
- ✅ Can be paused/cancelled
- ❌ No persistence - if connection drops, data lost
- ❌ Requires client to stay connected
- ❌ More complex backpressure handling

### Process Spawning (C++ Engine)

**How it works:**
```typescript
const process = spawn('./sim', [
  '--particles', '100',
  '--steps', '1000',
  '--seed', '42',
  '--mode', 'stream'
]);

process.stdout.on('data', (data) => {
  const frame = JSON.parse(data);
  // Process frame
});
```

**Tradeoffs:**
- ✅ Process isolation (crash-safe)
- ✅ Easy to implement
- ✅ Can run C++ from any language
- ❌ Overhead of process creation (~10-50ms)
- ❌ JSON serialization/parsing cost
- ❌ No shared memory (must copy data)

**Alternative: Native addon (N-API)**
- 10x faster (no process spawn, no JSON serialization)
- But: Crashes can kill Node.js, harder to debug, complex build process

**Why we chose process spawning:**
For this learning project, robustness and simplicity > micro-optimization. If we need native addon performance later, we can refactor.

## Design Patterns in the Architecture

### Factory Pattern (Simulation Creation)

**Where:** `SimulationProcessor.runSimulation()`

Creates simulation processes with different configurations:
```typescript
private runSimulation(params): Promise<void> {
  // Factory method - creates configured process
  const args = this.buildArgs(params);
  const process = spawn(this.binaryPath, args);
  return this.handleProcess(process);
}
```

### Strategy Pattern (Output Modes)

**Where:** C++ `--mode` flag (batch vs stream)

Different algorithms for same goal (output simulation data):
```cpp
if (mode == "stream") {
  // Strategy 1: Output each frame immediately
  for (int i = 0; i < steps; i++) {
    outputFrame(i);
    step(dt);
  }
} else {
  // Strategy 2: Collect all frames, output as array
  vector<string> frames;
  for (int i = 0; i < steps; i++) {
    frames.push_back(getFrame(i));
    step(dt);
  }
  outputAll(frames);
}
```

### Observer Pattern (WebSocket Streaming)

**Where:** WebSocket Gateway

Clients subscribe to simulation events:
```typescript
@WebSocketGateway()
export class StreamGateway {
  // Observers (connected clients) register
  @SubscribeMessage('start-stream')
  handleStream(client, payload) {
    // Notify all observers when new frame available
    this.server.to(client.id).emit('frame', frameData);
  }
}
```

### Command Pattern (Job Queue)

**Where:** BullMQ jobs

Jobs are commands encapsulating all info needed to execute:
```typescript
await queue.add('process-simulation', {
  jobId: '123',
  numParticles: 100,
  steps: 1000,
  seed: 42,
  // ... all parameters
});

// Later, worker executes the command
async process(job: Job) {
  const { jobId, numParticles, steps, seed } = job.data;
  await this.runSimulation(numParticles, steps, seed);
}
```

### Repository Pattern (Database Access)

**Where:** TypeORM repositories

Abstracts data access:
```typescript
@Injectable()
export class SimulationService {
  constructor(
    @InjectRepository(SimulationJob)
    private jobRepository: Repository<SimulationJob>
  ) {}
  
  async getJob(id: string) {
    return this.jobRepository.findOne({ where: { id } });
  }
}
```

## Scalability Considerations

### Current Architecture (Single Machine)

```
Single server:
  - NestJS backend (1 instance)
  - PostgreSQL (1 instance)
  - Redis (1 instance)
  - C++ simulations (spawned as needed)
```

**Bottlenecks:**
1. **CPU**: Many concurrent simulations on one machine
2. **Memory**: Large simulations with many particles
3. **Disk I/O**: Writing large output files

### Future Scaling Path

**Step 1: Horizontal scaling of workers**
```
                     ┌──> Worker 1 (spawn C++)
Load Balancer → API ─┼──> Worker 2 (spawn C++)
                     └──> Worker 3 (spawn C++)
                            ↓
                        Shared Redis (queue)
                        Shared PostgreSQL
```

**Step 2: Dedicated compute cluster**
```
API → Queue → Compute Workers → GPU cluster (CUDA acceleration)
```

**Step 3: Distributed simulations**
```
Large simulation → Split into chunks → Distribute → Merge results
```

For now, we optimize for: **Learning > Scale**

## Questions & Answers

**Q: Why not use a microservices architecture?**
A: We do! Backend + C++ engine + database + Redis are separate services. But we're not over-engineering - each service has a clear purpose.

**Q: Why spawn processes instead of using worker threads in Node.js?**
A: Worker threads are JavaScript. We need C++ performance. Process isolation also prevents crashes.

**Q: Why WebSockets for streaming instead of Server-Sent Events (SSE)?**
A: WebSockets are bidirectional (client can pause/resume). SSE is one-way. For real-time control, we need bidirectional.

**Q: Why PostgreSQL for simple CRUD operations?**
A: We could use SQLite or even JSON files. PostgreSQL prepares us for multi-user, transactions, and complex queries (job history, analytics).

**Q: Could we do all this in a monolith?**
A: Yes, but we'd lose: C++ performance, process isolation, service independence, and most importantly - we wouldn't learn about distributed systems!

## Summary

This architecture teaches:
- **Service boundaries**: CPU-bound vs I/O-bound
- **Communication patterns**: REST, WebSocket, process IPC
- **Async processing**: Queues, workers, retry logic
- **Data storage**: When to use SQL vs Redis vs filesystem
- **Design patterns**: Factory, Strategy, Observer, Command, Repository

Each decision has tradeoffs. The goal is to understand *why* we make these choices, not just *what* they are.
