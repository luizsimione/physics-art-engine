#!/bin/bash
# Run all tests across the entire project

set -e

echo "Running Full Test Suite"
echo "======================"

# Test C++ simulation engine
echo ""
echo "1. Testing C++ Simulation Engine..."
echo "-----------------------------------"
cd simulation-engine

# Build if needed
if [ ! -f sim ]; then
    clang++ -std=c++17 -O3 -I./include -o sim src/main.cpp src/simulation.cpp
fi

# Test batch mode
echo "Testing batch mode..."
./sim --particles 10 --steps 10 --seed 42 --mode batch > /tmp/test-batch.json
echo "✓ Batch mode works"

# Test stream mode
echo "Testing stream mode..."
./sim --particles 5 --steps 3 --seed 42 --mode stream > /tmp/test-stream.json
LINE_COUNT=$(wc -l < /tmp/test-stream.json)
if [ $LINE_COUNT -eq 3 ]; then
    echo "✓ Stream mode works"
else
    echo "✗ Stream mode failed"
    exit 1
fi

# Test determinism
echo "Testing determinism..."
./sim --particles 10 --steps 10 --seed 123 --mode batch > /tmp/test1.json
./sim --particles 10 --steps 10 --seed 123 --mode batch > /tmp/test2.json
if diff /tmp/test1.json /tmp/test2.json > /dev/null; then
    echo "✓ Determinism verified"
else
    echo "✗ Determinism test failed"
    exit 1
fi

cd ..

# Test backend
echo ""
echo "2. Testing Backend..."
echo "---------------------"
cd backend

# Install dependencies if needed
if [ ! -d node_modules ]; then
    npm install
fi

# Run linter
echo "Running linter..."
npm run lint
echo "✓ Linting passed"

# Run tests
echo "Running unit tests..."
npm test
echo "✓ Tests passed"

# Type checking
echo "Running type checks..."
npx tsc --noEmit
echo "✓ Type checking passed"

cd ..

echo ""
echo "======================"
echo "All tests passed! ✓"
echo "======================"
