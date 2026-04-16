#include "simulation.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <cmath>

Simulation::Simulation(int numParticles, unsigned int seed) : rng(seed) {
    initializeParticles(numParticles);
}

void Simulation::initializeParticles(int numParticles) {
    particles.reserve(numParticles);
    
    // Uniform distribution for positions and velocities
    std::uniform_real_distribution<double> posDist(-5.0, 5.0);
    std::uniform_real_distribution<double> velDist(-0.5, 0.5);
    std::uniform_real_distribution<double> massDist(0.5, 2.0);
    
    for (int i = 0; i < numParticles; ++i) {
        Vector2D pos(posDist(rng), posDist(rng));
        Vector2D vel(velDist(rng), velDist(rng));
        double mass = massDist(rng);
        
        particles.emplace_back(pos, vel, mass);
    }
}

Vector2D Simulation::calculateGravitationalForce(const Particle& p1, const Particle& p2) const {
    Vector2D direction = p2.position - p1.position;
    double distSquared = direction.magnitudeSquared() + SOFTENING * SOFTENING;
    double dist = std::sqrt(distSquared);
    
    // F = G * m1 * m2 / r^2, direction normalized
    double forceMagnitude = G * p1.mass * p2.mass / distSquared;
    
    return direction.normalized() * forceMagnitude;
}

void Simulation::step(double dt) {
    // Calculate forces (N-body)
    std::vector<Vector2D> forces(particles.size(), Vector2D(0, 0));
    
    for (size_t i = 0; i < particles.size(); ++i) {
        for (size_t j = i + 1; j < particles.size(); ++j) {
            Vector2D force = calculateGravitationalForce(particles[i], particles[j]);
            forces[i] += force;
            forces[j] -= force; // Newton's third law
        }
    }
    
    // Apply forces and update positions (Euler integration)
    for (size_t i = 0; i < particles.size(); ++i) {
        particles[i].applyForce(forces[i], dt);
        particles[i].updatePosition(dt);
    }
}

std::string Simulation::getCurrentFrameJSON(int frameNumber) const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(6);
    
    oss << "{\"frame\":" << frameNumber << ",\"particles\":[";
    
    for (size_t i = 0; i < particles.size(); ++i) {
        if (i > 0) oss << ",";
        oss << "{\"x\":" << particles[i].position.x
            << ",\"y\":" << particles[i].position.y
            << ",\"vx\":" << particles[i].velocity.x
            << ",\"vy\":" << particles[i].velocity.y
            << ",\"mass\":" << particles[i].mass << "}";
    }
    
    oss << "]}";
    return oss.str();
}

void Simulation::outputFrame(int frameNumber, const std::string& mode) const {
    std::string json = getCurrentFrameJSON(frameNumber);
    
    if (mode == "stream") {
        // Output to stdout for streaming (one line per frame)
        std::cout << json << std::endl;
    }
    // In batch mode, frames are collected and output at the end
}

void Simulation::run(int steps, double dt, const std::string& mode) {
    if (mode == "stream") {
        // Stream mode: output each frame as we simulate
        for (int frame = 0; frame < steps; ++frame) {
            outputFrame(frame, mode);
            step(dt);
        }
    } else {
        // Batch mode: simulate all steps, then output all frames as JSON array
        std::vector<std::string> frames;
        frames.reserve(steps);
        
        for (int frame = 0; frame < steps; ++frame) {
            frames.push_back(getCurrentFrameJSON(frame));
            step(dt);
        }
        
        // Output all frames as JSON array
        std::cout << "[";
        for (size_t i = 0; i < frames.size(); ++i) {
            if (i > 0) std::cout << ",";
            std::cout << frames[i];
        }
        std::cout << "]" << std::endl;
    }
}
