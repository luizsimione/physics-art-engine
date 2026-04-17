# Physics Art Engine - Frontend

React + TypeScript + Vite + Three.js oscilloscope-style visualization for real-time physics simulations.

## Features

- **Three Visualization Modes:**
  - **Waveform**: X-position over time (classic oscilloscope)
  - **Multi-Channel**: Stacked particle traces
  - **Vector Scope**: X vs Y Lissajous patterns

- **Real-time WebSocket streaming** from backend
- **Three.js/React Three Fiber** 3D rendering
- **CRT oscilloscope aesthetic** with green phosphor glow
- **Interactive controls** for simulation parameters

## Quick Start

### Install Dependencies

```bash
npm install
```

### Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` to point to your backend:

```bash
VITE_BACKEND_URL=http://localhost:3001
```

### Development

```bash
npm run dev
```

Access at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Oscilloscope.tsx    # Three.js visualization
│   │   ├── ControlPanel.tsx    # UI controls
│   │   └── ControlPanel.css
│   ├── hooks/
│   │   └── useWebSocket.ts     # WebSocket connection hook
│   ├── types/
│   │   └── simulation.ts       # TypeScript types
│   ├── App.tsx                 # Main app component
│   ├── App.css
│   ├── main.tsx                # Entry point
│   └── index.css
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Usage

1. **Start the backend** (see backend/README.md)
2. **Start the frontend** (`npm run dev`)
3. **Select visualization mode**
4. **Configure parameters** (particles, steps, FPS, seed)
5. **Click "Start Stream"**
6. **Watch the oscilloscope visualization**

## Visualization Modes

### Waveform Mode
Plots X-position of particles over time, creating a scrolling oscilloscope trace. Like watching an audio waveform on a traditional oscilloscope.

### Multi-Channel Mode
Displays multiple particles as stacked horizontal traces, each particle on its own "channel" with color coding.

### Vector Scope Mode
Plots X vs Y positions directly, creating Lissajous-style patterns. Shows the complete 2D phase space of the particle system.

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Three.js** - 3D rendering engine
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers
- **Socket.IO Client** - WebSocket communication

## Performance

- Target: 60 FPS rendering
- Backend throttles to configurable FPS (10-60)
- Frame history buffer: 100 frames for trails
- Automatic alpha blending for persistence effect

## Development

```bash
# Start dev server with HMR
npm run dev

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker

```bash
# Build
docker build -t physics-art-frontend .

# Run
docker run -p 3000:3000 -e VITE_BACKEND_URL=http://localhost:3001 physics-art-frontend
```

## License

MIT
