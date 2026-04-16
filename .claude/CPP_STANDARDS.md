# C++ Coding Standards

This document covers C++ best practices for the simulation engine, including modern C++17 patterns, memory management, performance optimization, and common pitfalls.

## C++ Version

**We use C++17** for:
- Structured bindings
- `std::optional`, `std::variant`
- `if constexpr`
- Fold expressions
- Better lambda capture

## Memory Management

### RAII (Resource Acquisition Is Initialization)

**The Golden Rule:** Resources should be acquired in constructors and released in destructors.

**✅ Good Example:**
```cpp
class Simulation {
private:
    std::vector<Particle> particles;  // Automatically managed
    std::unique_ptr<Grid> grid;       // Smart pointer manages memory
    
public:
    Simulation(int numParticles) {
        particles.reserve(numParticles);  // Acquire memory in constructor
        grid = std::make_unique<Grid>(100, 100);
    }
    // Destructor automatically cleans up - no explicit delete needed
};
```

**❌ Bad Example:**
```cpp
class Simulation {
private:
    Particle* particles;  // Manual memory management
    
public:
    Simulation(int numParticles) {
        particles = new Particle[numParticles];  // Must manually delete
    }
    ~Simulation() {
        delete[] particles;  // Easy to forget, double-delete, or leak
    }
};
```

### Smart Pointers

**Use smart pointers instead of raw pointers for ownership:**

```cpp
// ✅ Unique ownership
std::unique_ptr<Simulation> sim = std::make_unique<Simulation>(100);

// ✅ Shared ownership (multiple owners)
std::shared_ptr<Grid> grid = std::make_shared<Grid>(100, 100);

// ✅ Non-owning observer (doesn't manage lifetime)
std::weak_ptr<Grid> gridRef = grid;

// ❌ Raw pointer for ownership
Simulation* sim = new Simulation(100);  // Don't do this!
delete sim;
```

**When to use raw pointers:**
- **Never for ownership**
- Only for non-owning references where you're sure the object outlives the pointer
- Interfacing with C APIs

### The Rule of Zero

**If you don't need custom memory management, don't implement:** destructor, copy constructor, move constructor, copy assignment, move assignment.

```cpp
// ✅ Rule of Zero - let compiler handle everything
struct Particle {
    Vector2D position;
    Vector2D velocity;
    double mass;
    // No destructor, copy/move operations needed
};

// ❌ Unnecessary manual management
struct Particle {
    Vector2D position;
    Vector2D velocity;
    double mass;
    
    ~Particle() {}  // Unnecessary
    Particle(const Particle& other) = default;  // Unnecessary
};
```

### Move Semantics

**Use move semantics for performance when transferring ownership:**

```cpp
// Return by value - compiler will use move
std::vector<Particle> createParticles(int n) {
    std::vector<Particle> particles;
    particles.reserve(n);
    // ... populate particles
    return particles;  // Move, not copy
}

// Use std::move when transferring ownership
std::vector<Particle> particles = createParticles(100);
Simulation sim(std::move(particles));  // Transfer ownership
// particles is now empty, sim owns the data
```

## Performance Patterns

### Reserve Vector Capacity

```cpp
// ✅ Reserve capacity upfront
std::vector<Particle> particles;
particles.reserve(numParticles);  // Avoid multiple reallocations
for (int i = 0; i < numParticles; ++i) {
    particles.emplace_back(pos, vel, mass);
}

// ❌ No reservation - multiple reallocations
std::vector<Particle> particles;
for (int i = 0; i < numParticles; ++i) {
    particles.push_back(Particle{pos, vel, mass});  // May reallocate many times
}
```

### Emplace vs Push

```cpp
// ✅ Emplace - constructs in-place
particles.emplace_back(pos, vel, mass);

// ❌ Push - constructs temporary then copies
particles.push_back(Particle(pos, vel, mass));
```

### Pass by const Reference

```cpp
// ✅ Pass large objects by const reference
Vector2D calculateForce(const Particle& p1, const Particle& p2) {
    // No copying, can't modify
}

// ❌ Pass by value (copies)
Vector2D calculateForce(Particle p1, Particle p2) {
    // Copies both particles - expensive
}

// ✅ Pass small objects by value
double calculateDistance(Vector2D a, Vector2D b) {
    // Small structs (16 bytes) are cheap to copy
}
```

### Avoid Unnecessary Copies

```cpp
// ❌ Copies in loop
for (int i = 0; i < particles.size(); ++i) {
    Particle p = particles[i];  // Copy
    process(p);
}

// ✅ Use const reference
for (const auto& particle : particles) {
    process(particle);  // No copy
}

// ✅ Use reference when modifying
for (auto& particle : particles) {
    particle.position += particle.velocity * dt;
}
```

## Code Organization

### Header Files (.h)

**Include guards:**
```cpp
#ifndef SIMULATION_H
#define SIMULATION_H

// Declarations

#endif // SIMULATION_H
```

**What goes in headers:**
- Class declarations
- Function declarations
- Inline functions (small, frequently called)
- Template definitions (must be in header)
- Constants

**What doesn't:**
- Function implementations (unless inline/template)
- Large functions
- Internal helper functions

### Source Files (.cpp)

**Implementation only:**
```cpp
#include "simulation.h"
#include <iostream>

// Function implementations
void Simulation::run(int steps, double dt) {
    // Implementation
}
```

### Forward Declarations

**Use forward declarations to reduce compile times:**

```cpp
// simulation.h
class Grid;  // Forward declaration

class Simulation {
private:
    std::unique_ptr<Grid> grid;  // Pointer to forward-declared type
public:
    Simulation();
};
```

```cpp
// simulation.cpp
#include "simulation.h"
#include "grid.h"  // Full definition only in .cpp

Simulation::Simulation() : grid(std::make_unique<Grid>(100, 100)) {}
```

## Modern C++ Features

### Structured Bindings (C++17)

```cpp
// ✅ Clean tuple unpacking
auto [x, y] = std::make_pair(1.0, 2.0);

// ✅ Iterate with index
for (const auto& [index, particle] : enumerate(particles)) {
    std::cout << "Particle " << index << std::endl;
}
```

### std::optional (C++17)

```cpp
// ✅ Explicit "no value" instead of nullptr or magic values
std::optional<Particle> findParticle(int id) {
    auto it = std::find_if(particles.begin(), particles.end(),
        [id](const auto& p) { return p.id == id; });
    
    if (it != particles.end()) {
        return *it;
    }
    return std::nullopt;
}

// Usage
if (auto p = findParticle(42)) {
    std::cout << "Found: " << p->mass << std::endl;
}
```

### Constexpr

```cpp
// Compile-time constants
constexpr double PI = 3.14159265358979323846;
constexpr double G = 6.67430e-2;

// Compile-time functions
constexpr double square(double x) { return x * x; }
constexpr double circleArea(double r) { return PI * square(r); }

// Can be used in constant expressions
constexpr double area = circleArea(5.0);  // Computed at compile time
```

### Auto Type Deduction

```cpp
// ✅ Use auto when type is obvious
auto particles = std::vector<Particle>{};
auto it = particles.begin();
auto force = calculateForce(p1, p2);

// ❌ Don't use auto when it obscures intent
auto x = 5;  // Is this int? long? size_t?

// ✅ Be explicit when it helps readability
size_t numParticles = 100;
```

## Common Patterns in Our Codebase

### Value Objects (Vector2D, Particle)

**Small, immutable-ish structs:**

```cpp
class Vector2D {
public:
    double x, y;
    
    Vector2D() : x(0.0), y(0.0) {}
    Vector2D(double x, double y) : x(x), y(y) {}
    
    // Const methods don't modify
    double magnitude() const {
        return std::sqrt(x * x + y * y);
    }
    
    // Return new values instead of modifying
    Vector2D normalized() const {
        double mag = magnitude();
        return mag > 0 ? Vector2D(x / mag, y / mag) : Vector2D(0, 0);
    }
};
```

### Manager/System Classes (Simulation)

**Owns and manages a collection:**

```cpp
class Simulation {
private:
    std::vector<Particle> particles;
    std::mt19937 rng;
    
public:
    Simulation(int numParticles, unsigned int seed);
    
    void run(int steps, double dt);
    const std::vector<Particle>& getParticles() const { return particles; }
    
private:
    void step(double dt);
    Vector2D calculateGravitationalForce(const Particle& p1, const Particle& p2) const;
};
```

### Strategy Pattern (Output Modes)

```cpp
void Simulation::run(int steps, double dt, const std::string& mode) {
    if (mode == "stream") {
        runStreaming(steps, dt);
    } else {
        runBatch(steps, dt);
    }
}

private void runStreaming(int steps, double dt) {
    for (int frame = 0; frame < steps; ++frame) {
        outputFrame(frame);
        step(dt);
    }
}

private void runBatch(int steps, double dt) {
    std::vector<std::string> frames;
    frames.reserve(steps);
    
    for (int frame = 0; frame < steps; ++frame) {
        frames.push_back(getCurrentFrameJSON(frame));
        step(dt);
    }
    
    outputBatch(frames);
}
```

## Error Handling

### Where We Use Exceptions

```cpp
// Exceptional conditions (invalid input)
Simulation::Simulation(int numParticles, unsigned int seed) {
    if (numParticles <= 0) {
        throw std::invalid_argument("Number of particles must be positive");
    }
    // ...
}

// File I/O errors
std::ofstream file("output.json");
if (!file.is_open()) {
    throw std::runtime_error("Failed to open output file");
}
```

### Where We Don't Use Exceptions

```cpp
// Expected conditions - use return values
double Vector2D::magnitude() const {
    return std::sqrt(x * x + y * y);  // Can't fail
}

// Use std::optional for "not found"
std::optional<Particle> findParticle(int id);

// Use error codes for C API compatibility
int exportToFile(const char* path) {
    // Return 0 for success, error code otherwise
}
```

## Avoid Common Pitfalls

### 1. Off-by-One Errors

```cpp
// ✅ Use iterators
for (auto it = vec.begin(); it != vec.end(); ++it) {
    // Process *it
}

// ✅ Use range-based for
for (const auto& item : vec) {
    // Process item
}

// ❌ Easy to mess up
for (int i = 0; i < vec.size(); ++i) {
    // Did you mean i, i-1, or i+1?
}
```

### 2. Integer Division

```cpp
// ❌ Integer division truncates
double average = sum / count;  // If sum and count are int

// ✅ Cast to double
double average = static_cast<double>(sum) / count;
```

### 3. Comparisons with Floating Point

```cpp
// ❌ Exact comparison
if (distance == 0.0) { /* ... */ }

// ✅ Use epsilon
constexpr double EPSILON = 1e-9;
if (std::abs(distance) < EPSILON) { /* ... */ }
```

### 4. Vector Invalidation

```cpp
std::vector<int> vec = {1, 2, 3};
auto& ref = vec[0];

vec.push_back(4);  // May reallocate
// ref is now invalid!

// ✅ Don't hold references across modifications
// ✅ Or reserve capacity upfront
vec.reserve(100);  // Won't reallocate until 100 elements
```

## Compilation

### Compiler Flags

```bash
# Development (fast compilation, with debug symbols)
clang++ -std=c++17 -g -O0 -Wall -Wextra

# Production (optimized)
clang++ -std=c++17 -O3 -DNDEBUG

# Warnings as errors (strict)
clang++ -std=c++17 -O3 -Wall -Wextra -Werror
```

### Include Paths

```bash
# Specify include directory
clang++ -std=c++17 -I./include -o sim src/main.cpp src/simulation.cpp
```

## Summary of Best Practices

1. **Use RAII** - Resources acquired in constructors, released in destructors
2. **Prefer smart pointers** - `unique_ptr` and `shared_ptr` over raw pointers
3. **Follow Rule of Zero** - Let compiler generate special member functions
4. **Use const** - Mark methods and parameters const when they don't modify
5. **Reserve vector capacity** - Avoid reallocations
6. **Pass by const reference** - For large objects
7. **Use move semantics** - Transfer ownership efficiently
8. **Use modern C++** - auto, structured bindings, std::optional
9. **Use range-based for** - Cleaner than index loops
10. **Avoid premature optimization** - Profile before optimizing

## Learning Resources

- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)
- [Effective Modern C++](https://www.aristeia.com/EMC++.html) by Scott Meyers
- [C++ Reference](https://en.cppreference.com/)
- [CppCon Talks](https://www.youtube.com/user/CppCon) on YouTube

## Questions?

When writing C++, ask yourself:
- **Who owns this memory?** (Prefer smart pointers to make ownership explicit)
- **Will this copy?** (Use const& or move to avoid unnecessary copies)
- **Could this throw?** (Handle exceptions or use noexcept)
- **Is this const-correct?** (Mark read-only operations as const)
