#ifndef SIMULATION_H
#define SIMULATION_H

#include "particle.h"
#include <vector>
#include <random>
#include <string>

class Simulation {
public:
    Simulation(int numParticles, unsigned int seed);
    
    // Run simulation for specified number of steps
    void run(int steps, double dt, const std::string& mode);
    
    // Get current particles
    const std::vector<Particle>& getParticles() const { return particles; }
    
    // Output current frame as JSON
    std::string getCurrentFrameJSON(int frameNumber) const;

private:
    std::vector<Particle> particles;
    std::mt19937 rng;
    
    // Constants
    static constexpr double G = 6.67430e-2; // Gravitational constant (scaled for visualization)
    static constexpr double SOFTENING = 0.1; // Softening parameter to avoid singularities
    
    // Initialize particles with random positions and velocities
    void initializeParticles(int numParticles);
    
    // Calculate gravitational force between two particles
    Vector2D calculateGravitationalForce(const Particle& p1, const Particle& p2) const;
    
    // Perform one simulation step (Euler integration)
    void step(double dt);
    
    // Output frame to stdout or file depending on mode
    void outputFrame(int frameNumber, const std::string& mode) const;
};

#endif // SIMULATION_H
