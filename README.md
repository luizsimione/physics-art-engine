# Generative Physics Art Engine

A modular system that generates physics-based artwork using a high-performance C++ N-body simulation engine, orchestrated via NestJS backend with async job processing, designed for real-time WebSocket streaming and oscilloscope-style visualization.

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow and branching strategy
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - AWS deployment guide
- [docs/README_PRODUCTION.md](docs/README_PRODUCTION.md) - Production setup and API reference
- [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md) - SonarCloud setup, testing strategy, and quality gates

## Project Overview

**Current Status:** Full-stack application complete with oscilloscope visualization

**Features:**
- **Batch generation**: Async job queue for C++ simulation execution
- **Job management**: REST API with status tracking, retry logic, persistence
- **Real-time streaming**: WebSocket streaming with frame throttling (30 FPS default)
- **Oscilloscope UI**: Retro CRT aesthetic with Three.js - three visualization modes

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────┐
│   C++ Engine    │◄─────│  NestJS Backend  │◄─────│ React Frontend │
│  (N-body Sim)   │      │  (API + WebSocket)│     │  (Three.js)    │
└─────────────────┘      └──────────────────┘      └────────────────┘
                               ▲      ▲
                               │      │
                         ┌─────┴──┐  ┌┴────────┐
                         │PostgreSQL│ │  Redis  │
                         │(Metadata)│ │ (Queue) │
                         └──────────┘ └─────────┘
                               ▲
                               │
                         ┌─────┴──────┐
                         │   Python   │
                         │ ML Service │
                         │  (Future)  │
                         └────────────┘
```

## Quick Start

### Prerequisites

- **C++ Compiler**: clang++ or g++ with C++17 support
- **Node.js**: v18+ (for backend)
- **Docker & Docker Compose**: For full system deployment
- **PostgreSQL**: v14+ (or use Docker)
- **Redis**: v6+ (or use Docker)

### Phase 1: C++ Simulation Engine (COMPLETED)

```bash
# Navigate to simulation engine
cd simulation-engine

# Build the simulation binary
clang++ -std=c++17 -O3 -I./include -o sim src/main.cpp src/simulation.cpp

# Run a test simulation
./sim --particles 50 --steps 100 --seed 42 --mode batch > output.json

# Run in streaming mode
./sim --particles 100 --steps 1000 --seed 123 --mode stream

# View help
./sim --help
```

**Features Implemented:**
- Vector2D math utilities
- N-body particle system with gravity
- Deterministic seeding (same seed = same output)
- Euler integration time-stepping
- CLI interface with argument parsing
- Two output modes: batch (JSON array) and stream (line-by-line JSON)

### Phase 2: Backend API (COMPLETED)

```bash
# Quick start with development script
./scripts/dev.sh

# Or manual setup:
cd backend
npm install

# Start development server
npm run start:dev

# Available endpoints:
# GET /              - API status
# GET /health        - Health check
# POST /generate     - Create simulation job
# GET /art/:id       - Retrieve simulation results
# GET /jobs          - List all jobs
# GET /jobs/:id/status - Get job status

# WebSocket Gateway
# Connect to ws://localhost:3001
# Events: start-stream, stop-stream, frame, stream-started, stream-stopped, stream-error
```

**What's implemented:**
- NestJS backend with TypeScript
- PostgreSQL + TypeORM (auto-migrations)
- Redis + BullMQ job queue with retry logic
- C++ process spawner service
- REST API with 6 endpoints
- WebSocket gateway with Socket.IO
- Real-time frame streaming with throttling (30 FPS)
- Backpressure handling and client disconnect cleanup
- Input validation (class-validator)
- Error handling and status tracking
- Docker Compose for local development
- GitHub Actions CI/CD pipeline
- Unit tests (60 tests passing)
- Husky pre-commit hooks (lint + test)

### Phase 3: Frontend (PLANNED)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Full System (Docker Compose)

```bash
# Start all services
docker-compose up

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

## Project Structure

```
physics-art-engine/
├── simulation-engine/       # C++ N-body simulation
│   ├── include/
│   │   ├── vector2d.h      # 2D vector math
│   │   ├── particle.h      # Particle structure
│   │   └── simulation.h    # Main simulation class
│   ├── src/
│   │   ├── main.cpp        # CLI entry point
│   │   └── simulation.cpp  # Simulation implementation
│   ├── CMakeLists.txt      # CMake build config
│   └── sim                 # Compiled binary
│
├── backend/                 # NestJS API (COMPLETED)
│   ├── src/
│   │   ├── main.ts         # Application entry point
│   │   ├── app.module.ts   # Root module
│   │   ├── config/         # Database & environment config
│   │   └── modules/        # Feature modules
│   │       ├── simulation/ # Batch job orchestration
│   │       │   ├── simulation.controller.ts
│   │       │   ├── simulation.service.ts
│   │       │   ├── simulation.processor.ts
│   │       │   ├── dto/    # Data transfer objects
│   │       │   └── entities/
│   │       └── stream/     # WebSocket streaming
│   │           ├── stream.gateway.ts
│   │           ├── stream.service.ts
│   │           └── dto/    # Stream DTOs
│   ├── tests/              # All test files (separate from source)
│   │   ├── modules/
│   │   │   ├── simulation/
│   │   │   └── stream/
│   │   └── app.service.test.ts
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                # React + Three.js (TODO)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # WebSocket hooks
│   │   └── utils/          # Frame buffer
│   ├── package.json
│   └── Dockerfile
│
├── ml-service/              # Python ML (Future)
│   ├── main.py
│   ├── models/
│   └── requirements.txt
│
├── docker-compose.yml       # Multi-service orchestration
├── .env.example             # Environment template
└── README.md               # This file
```

## Implementation Status

### Milestone 1: C++ Physics Engine (COMPLETED)
- [x] Implement Vector2D math utilities
- [x] Create Particle struct with position, velocity, mass
- [x] Implement N-body gravitational force calculation (O(N²))
- [x] Add Euler integration time-stepping
- [x] Implement deterministic seeding with std::mt19937
- [x] Create CLI interface with argument parsing
- [x] Add batch and stream output modes
- [x] Build and test standalone engine

### Milestone 2: Backend API (COMPLETED)
- [x] Initialize NestJS project with TypeScript
- [x] Setup PostgreSQL with TypeORM entities and auto-migrations
- [x] Implement BullMQ job queue with retry logic (3 attempts, exponential backoff)
- [x] Create C++ process spawner service with stdio parsing
- [x] Build REST endpoints (POST /generate, GET /art/:id, GET /jobs, GET /health)
- [x] Add comprehensive error handling and input validation
- [x] Store simulation outputs to filesystem
- [x] Add Docker containerization (dev + prod)
- [x] Setup GitHub Actions CI/CD pipeline
- [x] Add unit tests and E2E testing
- [x] Configure Husky pre-commit hooks (lint + test + type-check)

### Milestone 3: WebSocket Streaming (COMPLETED)
- [x] Integrate WebSocket gateway in NestJS
- [x] Implement real-time streaming orchestration
- [x] Add frame throttling (30 FPS)
- [x] Handle backpressure and client disconnects
- [x] Test concurrent streaming sessions

### Milestone 4: Oscilloscope Frontend (COMPLETED)
- [x] Initialize React + Vite + TypeScript
- [x] Setup Three.js scene with CRT oscilloscope aesthetic
- [x] Implement WebSocket client connection
- [x] Build 3 rendering modes:
  - [x] Waveform Mode (X position over time)
  - [x] Multi-Channel Mode (multiple particle traces)
  - [x] Vector Scope Mode (X vs Y Lissajous patterns)
- [x] Add control panel (start/stop, seed, mode toggle)
- [x] Optimize rendering with sliding window buffer

### Milestone 5: Docker Orchestration (COMPLETED)
- [x] Create Dockerfiles for each service
- [x] Write docker-compose.yml
- [x] Configure service networking
- [x] Add health checks
- [x] Test end-to-end deployment

### Milestone 6: Python ML Layer (OPTIONAL)
- [ ] Setup FastAPI service
- [ ] Implement feature extraction (velocity, entropy)
- [ ] Train KMeans clustering on simulation data
- [ ] Create parameter generation endpoint
- [ ] Integrate with backend workflow

## Testing & Verification

### C++ Engine Tests

```bash
cd simulation-engine

# Determinism test (same seed = same output)
./sim --particles 50 --steps 100 --seed 42 > output1.json
./sim --particles 50 --steps 100 --seed 42 > output2.json
diff output1.json output2.json  # Should be identical

# Performance test
time ./sim --particles 1000 --steps 10000 --seed 42 --mode batch > large.json

# Streaming test
./sim --particles 100 --steps 50 --seed 42 --mode stream | head -n 10
```

### Backend API Tests

```bash
# Job creation
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{"numParticles": 100, "steps": 1000, "seed": 42}'

# Job retrieval
curl http://localhost:3001/art/:jobId

# List jobs
curl http://localhost:3001/jobs
```

## Visualization Modes

### 1. Waveform Mode
Plot the X-position of particles over time, creating a scrolling oscilloscope trace.

### 2. Multi-Channel Mode
Display multiple particles as stacked horizontal traces, like a multi-channel oscilloscope.

### 3. Vector Scope Mode
Plot X vs Y positions directly, creating Lissajous-style patterns similar to vectorscope displays.

## Configuration

### Simulation Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--particles` | 100 | Number of particles in simulation |
| `--steps` | 1000 | Number of simulation time steps |
| `--seed` | 42 | Random seed for reproducibility |
| `--mode` | batch | Output mode: `batch` or `stream` |
| `--dt` | 0.01 | Time step size |

### Physics Constants

- **Gravitational Constant (G)**: 6.67430e-2 (scaled for visualization)
- **Softening Parameter**: 0.1 (prevents singularities)
- **Integration Method**: Euler (upgradeable to RK4)

## Deployment

### Local Development

```bash
# Start backend
cd backend && npm run start:dev

# Start frontend (in another terminal)
cd frontend && npm run dev

# Start PostgreSQL & Redis (via Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:14
docker run -d -p 6379:6379 redis:6
```

### Production (Docker Compose)

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean volumes
docker-compose down -v
```

## Performance Considerations

### C++ Simulation
- **Complexity**: O(N²) per time step for N particles
- **Recommended limits**:
  - Real-time streaming: 100-200 particles
  - Batch generation: 1000-5000 particles
- **Optimization paths**:
  - Spatial hashing for O(N) nearby particle interactions
  - GPU acceleration with CUDA/OpenCL
  - Barnes-Hut algorithm for O(N log N) complexity

### WebSocket Streaming
- **Frame rate**: 30 FPS default (configurable)
- **Backpressure**: Automatic frame dropping if client can't keep up
- **Buffer size**: 1000 frames sliding window

### Frontend Rendering
- **Target**: 60 FPS rendering
- **Techniques**: requestAnimationFrame, WebGL hardware acceleration
- **Optimizations**: Instanced rendering, custom shaders

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Simulation Engine | C++17 | High-performance physics calculations |
| Backend API | NestJS + TypeScript | Job orchestration, WebSocket server |
| Job Queue | BullMQ + Redis | Asynchronous job processing |
| Database | PostgreSQL + TypeORM | Job metadata persistence |
| Frontend | React + TypeScript + Vite | User interface |
| Visualization | Three.js + @react-three/fiber | 3D rendering engine |
| Streaming | Socket.IO | Real-time WebSocket communication |
| ML Layer | Python + FastAPI + scikit-learn | Parameter generation (future) |
| Deployment | Docker + Docker Compose | Containerization |

## API Reference

### REST Endpoints

#### POST /generate
Create a new simulation job.

**Request:**
```json
{
  "numParticles": 100,
  "steps": 1000,
  "seed": 42
}
```

**Response:**
```json
{
  "jobId": "uuid-v4",
  "status": "pending",
  "createdAt": "2026-04-15T23:00:00Z"
}
```

#### GET /art/:id
Retrieve simulation results.

**Response:**
```json
{
  "jobId": "uuid-v4",
  "status": "completed",
  "numParticles": 100,
  "steps": 1000,
  "seed": 42,
  "outputPath": "/output/uuid-v4/frames.json",
  "createdAt": "2026-04-15T23:00:00Z",
  "completedAt": "2026-04-15T23:00:30Z"
}
```

### WebSocket Events

Connect to `ws://localhost:3001` (or your deployment URL).

#### Client → Server: `start-stream`
Start a real-time simulation stream.

**Request:**
```json
{
  "numParticles": 100,
  "steps": 10000,
  "seed": 42,
  "fps": 30,
  "dt": 0.01
}
```

**Parameters:**
- `numParticles` (required): Number of particles (1-1000)
- `steps` (optional): Number of simulation steps (default: 10000)
- `seed` (optional): Random seed for reproducibility (auto-generated if omitted)
- `fps` (optional): Target frames per second (1-60, default: 30)
- `dt` (optional): Time step size (0.001-0.1, default: 0.01)

#### Client → Server: `stop-stream`
Stop the current simulation stream.

**Request:**
```json
{}
```

#### Server → Client: `stream-started`
Confirmation that the stream has started.

**Response:**
```json
{
  "message": "Simulation stream started",
  "params": {
    "numParticles": 100,
    "steps": 10000,
    "seed": 42,
    "fps": 30,
    "dt": 0.01
  }
}
```

#### Server → Client: `frame`
Real-time frame data (emitted at target FPS).

**Response:**
```json
{
  "frame": 123,
  "particles": [
    {"x": 0.5, "y": 1.2, "vx": 0.1, "vy": -0.2, "mass": 1.5},
    {"x": -0.3, "y": 0.8, "vx": -0.05, "vy": 0.15, "mass": 2.0}
  ]
}
```

#### Server → Client: `stream-stopped`
Confirmation that the stream has stopped.

**Response:**
```json
{
  "message": "Simulation stream stopped"
}
```

#### Server → Client: `stream-error`
Error occurred during streaming.

**Response:**
```json
{
  "message": "Error description"
}
```

## Future Enhancements

- [ ] GPU acceleration with CUDA/OpenCL
- [ ] Genetic algorithms for art evolution
- [ ] FFT analysis overlay (frequency domain visualization)
- [ ] User authentication and art galleries
- [ ] Export to video (MP4, GIF)
- [ ] Custom particle interaction rules
- [ ] 3D simulation and visualization
- [ ] Multi-user collaborative sessions
- [ ] WebGL custom shaders for visual effects
- [ ] Performance analytics dashboard

## License

MIT

## Acknowledgments

Built as a demonstration of distributed systems design, combining high-performance computing, real-time streaming, and interactive visualization.

---

**Status**: Milestones 1-4 Complete ✓ Full-Stack Physics Art Engine Ready

**Last Updated**: April 16, 2026
