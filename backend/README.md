# Physics Art Engine - Backend

NestJS backend API for orchestrating physics simulations and managing job queues.

## Features

- REST API for simulation job management
- PostgreSQL database with TypeORM
- BullMQ job queue with Redis
- C++ simulation process spawning
- Automatic retry logic for failed jobs
- File-based output storage

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
