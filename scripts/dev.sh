#!/bin/bash
# Development startup script

set -e

echo "Starting Physics Art Engine (Development Mode)"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start database services
echo "Starting PostgreSQL and Redis..."
docker compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Check PostgreSQL
until docker exec -i physics-art-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo "✓ PostgreSQL is ready"

# Check Redis
until docker exec -i physics-art-redis redis-cli ping > /dev/null 2>&1; do
    echo "Waiting for Redis..."
    sleep 2
done
echo "✓ Redis is ready"

# Build C++ simulation if needed
if [ ! -f simulation-engine/sim ]; then
    echo "Building C++ simulation engine..."
    cd simulation-engine
    clang++ -std=c++17 -O3 -I./include -o sim src/main.cpp src/simulation.cpp
    cd ..
    echo "✓ Simulation engine built"
fi

# Install backend dependencies if needed
if [ ! -d backend/node_modules ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

echo ""
echo "Development environment is ready!"
echo ""
echo "To start the backend:"
echo "  cd backend && npm run start:dev"
echo ""
echo "API will be available at: http://localhost:3001"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"
echo ""
echo "To stop services:"
echo "  docker compose -f docker-compose.dev.yml down"
