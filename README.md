# Generative Physics Art Engine (Oscilloscope UI)

A distributed system that generates physics-based artwork using a high-performance C++ N-body simulation engine, orchestrated via NestJS backend, streamed in real-time via WebSockets, and visualized through an oscilloscope-style interface using React + Three.js.

## 🎯 Project Overview

This system supports:
- **Batch generation**: Store and retrieve generated art via job queue
- **Real-time streaming**: Live oscilloscope-style visualization of physics simulations

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

## 🚀 Quick Start

### Prerequisites

- **C++ Compiler**: clang++ or g++ with C++17 support
- **Node.js**: v18+ (for backend)
- **Docker & Docker Compose**: For full system deployment
- **PostgreSQL**: v14+ (or use Docker)
- **Redis**: v6+ (or use Docker)

### Phase 1: C++ Simulation Engine (✅ COMPLETED)

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
- ✅ Vector2D math utilities
- ✅ N-body particle system with gravity
- ✅ Deterministic seeding (same seed = same output)
- ✅ Euler integration time-stepping
- ✅ CLI interface with argument parsing
- ✅ Two output modes: batch (JSON array) and stream (line-by-line JSON)

### Phase 2: Backend API (🚧 IN PROGRESS)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database and Redis credentials

# Run migrations
npm run migration:run

# Start development server
npm run start:dev

# Available endpoints:
# POST /generate - Create simulation job
# GET /art/:id - Retrieve simulation results
# GET /jobs - List all jobs
# WebSocket /stream - Real-time streaming
```

### Phase 3: Frontend (📋 PLANNED)

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

## 📁 Project Structure

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
├── backend/                 # NestJS API (TODO)
│   ├── src/
│   │   ├── simulation/     # Simulation orchestration
│   │   ├── stream/         # WebSocket streaming
│   │   └── app.module.ts   # Root module
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

## 🔬 Implementation Steps

### ✅ Milestone 1: C++ Physics Engine (COMPLETED)
- [x] Implement Vector2D math utilities
- [x] Create Particle struct with position, velocity, mass
- [x] Implement N-body gravitational force calculation
- [x] Add Euler integration time-stepping
- [x] Implement deterministic seeding with std::mt19937
- [x] Create CLI interface with argument parsing
- [x] Add batch and stream output modes
- [x] Build and test standalone engine

### 🚧 Milestone 2: Backend API (IN PROGRESS)
- [ ] Initialize NestJS project
- [ ] Setup PostgreSQL with TypeORM entities
- [ ] Implement BullMQ job queue
- [ ] Create C++ process spawner service
- [ ] Build REST endpoints (POST /generate, GET /art/:id)
- [ ] Add error handling and validation
- [ ] Store simulation outputs to filesystem

### 📋 Milestone 3: WebSocket Streaming (PLANNED)
- [ ] Integrate WebSocket gateway in NestJS
- [ ] Implement real-time streaming orchestration
- [ ] Add frame throttling (30 FPS)
- [ ] Handle backpressure and client disconnects
- [ ] Test concurrent streaming sessions

### 📋 Milestone 4: Oscilloscope Frontend (PLANNED)
- [ ] Initialize React + Vite + TypeScript
- [ ] Setup Three.js scene with black background + green lines
- [ ] Implement WebSocket client connection
- [ ] Build 3 rendering modes:
  - [ ] Waveform Mode (X position over time)
  - [ ] Multi-Channel Mode (multiple particle traces)
  - [ ] Vector Scope Mode (X vs Y Lissajous patterns)
- [ ] Add control panel (start/stop, seed, mode toggle)
- [ ] Optimize rendering with sliding window buffer

### 📋 Milestone 5: Docker Orchestration (PLANNED)
- [ ] Create Dockerfiles for each service
- [ ] Write docker-compose.yml
- [ ] Configure service networking
- [ ] Add health checks
- [ ] Test end-to-end deployment

### 📋 Milestone 6: Python ML Layer (OPTIONAL)
- [ ] Setup FastAPI service
- [ ] Implement feature extraction (velocity, entropy)
- [ ] Train KMeans clustering on simulation data
- [ ] Create parameter generation endpoint
- [ ] Integrate with backend workflow

## 🧪 Testing & Verification

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

## 🎨 Visualization Modes

### 1. Waveform Mode
Plot the X-position of particles over time, creating a scrolling oscilloscope trace.

### 2. Multi-Channel Mode
Display multiple particles as stacked horizontal traces, like a multi-channel oscilloscope.

### 3. Vector Scope Mode
Plot X vs Y positions directly, creating Lissajous-style patterns similar to vectorscope displays.

## 🔧 Configuration

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

## 🚀 Deployment

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

## 📊 Performance Considerations

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

## 🛠️ Tech Stack

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

## 📝 API Reference

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

#### Client → Server: `start-stream`
```json
{
  "numParticles": 100,
  "seed": 42,
  "fps": 30
}
```

#### Server → Client: `frame`
```json
{
  "frame": 123,
  "particles": [
    {"x": 0.5, "y": 1.2, "vx": 0.1, "vy": -0.2, "mass": 1.5}
  ]
}
```

## 🔮 Future Enhancements

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

## 📄 License

MIT

## 🙏 Acknowledgments

Built as a demonstration of distributed systems design, combining high-performance computing, real-time streaming, and interactive visualization.

---

**Status**: Phase 1 Complete | Phase 2-6 In Progress

**Last Updated**: April 15, 2026
