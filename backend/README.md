# Physics Art Engine - Backend

NestJS backend API for orchestrating physics simulations and managing job queues.

## Features

- REST API for simulation job management
- PostgreSQL database with TypeORM
- BullMQ job queue with Redis
- C++ simulation process spawning
- Automatic retry logic for failed jobs
- File-based output storage

## Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller
│   ├── app.service.ts             # Root service
│   ├── config/                    # Configuration files
│   │   └── database.config.ts
│   └── modules/                   # Feature modules
│       ├── simulation/            # Batch simulation module
│       │   ├── simulation.module.ts
│       │   ├── simulation.controller.ts
│       │   ├── simulation.service.ts
│       │   ├── simulation.processor.ts
│       │   ├── dto/
│       │   │   └── create-simulation.dto.ts
│       │   └── entities/
│       │       └── simulation-job.entity.ts
│       └── stream/                # WebSocket streaming module
│           ├── stream.module.ts
│           ├── stream.gateway.ts
│           ├── stream.service.ts
│           └── dto/
│               └── start-stream.dto.ts
├── tests/                         # All test files (separate from source)
│   ├── app.service.test.ts
│   └── modules/
│       ├── simulation/
│       │   ├── simulation.controller.test.ts
│       │   ├── simulation.service.test.ts
│       │   └── simulation.processor.test.ts
│       └── stream/
│           ├── stream.gateway.test.ts
│           └── stream.service.test.ts
├── output/                        # Generated simulation outputs
├── coverage/                      # Test coverage reports
└── dist/                          # Compiled output
```

**Key Conventions:**
- Feature modules in `src/modules/<feature>/`
- Tests in `tests/` directory (not colocated)
- Test files use `.test.ts` suffix
- DTOs in `dto/` subdirectory within each module
- Entities/schemas in `entities/` subdirectory

## Setup

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Database Setup

Make sure PostgreSQL is running:

```bash
# Using Docker
docker run -d \
  --name physics-art-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=physics_art \
  -p 5432:5432 \
  postgres:14

# Or use your local PostgreSQL instance
```

### Redis Setup

Make sure Redis is running:

```bash
# Using Docker
docker run -d \
  --name physics-art-redis \
  -p 6379:6379 \
  redis:6

# Or use your local Redis instance
```

### Run Migrations

```bash
npm run migration:run
```

## Development

```bash
# Start in development mode (with hot reload)
npm run start:dev

# Start in debug mode
npm run start:debug
```

The API will be available at `http://localhost:3001`

## Production

```bash
# Build
npm run build

# Start production server
npm run start:prod
```

## API Endpoints

### Health Check

```bash
GET /
GET /health
```

### Create Simulation Job

```bash
POST /generate
Content-Type: application/json

{
  "numParticles": 100,
  "steps": 1000,
  "seed": 42,
  "dt": 0.01  // optional
}

Response:
{
  "jobId": "uuid-v4",
  "status": "pending",
  "createdAt": "2026-04-15T23:00:00Z"
}
```

### Get Simulation Result

```bash
GET /art/:id

Response:
{
  "id": "uuid-v4",
  "numParticles": 100,
  "steps": 1000,
  "seed": 42,
  "dt": 0.01,
  "status": "completed",
  "outputPath": "./output/uuid-v4/frames.json",
  "createdAt": "2026-04-15T23:00:00Z",
  "completedAt": "2026-04-15T23:00:30Z",
  "processingTimeMs": 30000
}
```

### Get Job Status

```bash
GET /jobs/:id/status

Response:
{
  "id": "uuid-v4",
  "status": "completed",
  "createdAt": "2026-04-15T23:00:00Z",
  "completedAt": "2026-04-15T23:00:30Z",
  "processingTimeMs": 30000
}
```

### List All Jobs

```bash
GET /jobs

Response: [
  {
    "id": "uuid-v4",
    "numParticles": 100,
    "steps": 1000,
    "seed": 42,
    "status": "completed",
    ...
  }
]
```

## Job Statuses

- `pending` - Job created and queued
- `processing` - Job is currently running
- `completed` - Job finished successfully
- `failed` - Job failed (with error message)

## Architecture

```
SimulationController
    ↓
SimulationService (manages DB + Queue)
    ↓
BullMQ Queue
    ↓
SimulationProcessor (spawns C++ process)
    ↓
C++ Binary (generates frames.json)
    ↓
File Storage (./output/:jobId/frames.json)
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Linting

```bash
# Run ESLint
npm run lint

# Format code
npm run format
```

## WebSocket Streaming

The backend includes a WebSocket gateway for real-time simulation streaming.

### Testing WebSocket Streaming

Use the included test client to verify streaming functionality:

```bash
# Basic test (50 particles, 30 FPS)
node test-websocket-client.js

# Custom configuration
node test-websocket-client.js --particles 100 --steps 2000 --fps 60 --seed 42

# Connect to remote server
node test-websocket-client.js --url ws://your-server.com:3001
```

**Options:**
- `--particles <n>` - Number of particles (default: 50)
- `--steps <n>` - Number of simulation steps (default: 1000)
- `--seed <n>` - Random seed for reproducibility (default: auto-generated)
- `--fps <n>` - Target frames per second (default: 30)
- `--url <url>` - WebSocket server URL (default: ws://localhost:3001)

**Example Output:**
```
🚀 Physics Art Engine - WebSocket Test Client

Configuration:
  URL:       ws://localhost:3001
  Particles: 50
  Steps:     1000
  FPS:       30

✓ Connected to server
→ Starting simulation stream...

✓ Stream started: Simulation stream started
→ Receiving frames...

Frame    30 | Particles:  50 | Elapsed: 1.0s | FPS: 30.0
  → Particle[0]: x=0.123, y=0.456, vx=0.012, vy=-0.034

✓ Stream stopped: Simulation stream stopped

Statistics:
  Total Frames:   1000
  Elapsed Time:   33.2s
  Average FPS:    30.1
  Expected FPS:   30
```

### WebSocket Events

**Client → Server:**
- `start-stream` - Start simulation with parameters
- `stop-stream` - Stop current simulation

**Server → Client:**
- `stream-started` - Confirmation with parameters
- `frame` - Real-time frame data
- `stream-stopped` - Stream ended
- `stream-error` - Error occurred

### Integration with Frontend

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  socket.emit('start-stream', {
    numParticles: 100,
    steps: 10000,
    seed: 42,
    fps: 30,
    dt: 0.01
  });
});

socket.on('frame', (data) => {
  // data.frame: frame number
  // data.particles: array of {x, y, vx, vy, mass}
  updateVisualization(data.particles);
});

socket.on('stream-error', (error) => {
  console.error('Stream error:', error.message);
});
```
