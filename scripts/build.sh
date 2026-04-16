#!/bin/bash
# Production build and deployment script

set -e

echo "Building Physics Art Engine for Production"
echo "=========================================="

# Build C++ simulation engine
echo "Building simulation engine..."
cd simulation-engine
clang++ -std=c++17 -O3 -I./include -o sim src/main.cpp src/simulation.cpp
cd ..
echo "✓ Simulation engine built"

# Build backend
echo "Building backend..."
cd backend
npm ci --production=false
npm run build
npm run test
cd ..
echo "✓ Backend built and tested"

# Build Docker images
echo "Building Docker images..."
docker compose build

echo ""
echo "Production build complete!"
echo ""
echo "To start all services:"
echo "  docker compose up -d"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
