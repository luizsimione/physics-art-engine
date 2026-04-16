#ifndef VECTOR2D_H
#define VECTOR2D_H

#include <cmath>

class Vector2D {
public:
    double x, y;

    // Constructors
    Vector2D() : x(0.0), y(0.0) {}
    Vector2D(double x, double y) : x(x), y(y) {}

    // Vector operations
    Vector2D operator+(const Vector2D& other) const {
        return Vector2D(x + other.x, y + other.y);
    }

    Vector2D operator-(const Vector2D& other) const {
        return Vector2D(x - other.x, y - other.y);
    }

    Vector2D operator*(double scalar) const {
        return Vector2D(x * scalar, y * scalar);
    }

    Vector2D operator/(double scalar) const {
        return Vector2D(x / scalar, y / scalar);
    }

    Vector2D& operator+=(const Vector2D& other) {
        x += other.x;
        y += other.y;
        return *this;
    }

    Vector2D& operator-=(const Vector2D& other) {
        x -= other.x;
        y -= other.y;
        return *this;
    }

    // Magnitude
    double magnitude() const {
        return std::sqrt(x * x + y * y);
    }

    double magnitudeSquared() const {
        return x * x + y * y;
    }

    // Normalize
    Vector2D normalized() const {
        double mag = magnitude();
        if (mag > 0) {
            return *this / mag;
        }
        return Vector2D(0, 0);
    }

    // Dot product
    double dot(const Vector2D& other) const {
        return x * other.x + y * other.y;
    }

    // Distance between two points
    static double distance(const Vector2D& a, const Vector2D& b) {
        return (b - a).magnitude();
    }

    static double distanceSquared(const Vector2D& a, const Vector2D& b) {
        return (b - a).magnitudeSquared();
    }
};

#endif // VECTOR2D_H
