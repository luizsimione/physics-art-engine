#ifndef PARTICLE_H
#define PARTICLE_H

#include "vector2d.h"

struct Particle {
    Vector2D position;
    Vector2D velocity;
    double mass;

    Particle() : position(0, 0), velocity(0, 0), mass(1.0) {}
    Particle(const Vector2D& pos, const Vector2D& vel, double m)
        : position(pos), velocity(vel), mass(m) {}
    
    // Apply force to particle (updates velocity)
    void applyForce(const Vector2D& force, double dt) {
        // F = ma, so a = F/m
        Vector2D acceleration = force / mass;
        velocity += acceleration * dt;
    }

    // Update position based on velocity
    void updatePosition(double dt) {
        position += velocity * dt;
    }
};

#endif // PARTICLE_H
