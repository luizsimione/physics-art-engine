# Physics Art Engine - Development Context

This directory contains comprehensive documentation about code standards, architectural patterns, design decisions, and best practices for the Physics Art Engine project.

## Purpose

This distributed system generates physics-based artwork using:
- **C++ N-body simulation engine** (high-performance compute)
- **NestJS backend** (orchestration, WebSocket streaming, job queue)
- **React + Three.js frontend** (oscilloscope-style visualization)
- **PostgreSQL** (job metadata persistence)
- **Redis/BullMQ** (asynchronous job processing)

## Learning Goals

This project is designed to teach:
- **System design tradeoffs** - Why separate services? When to use queues vs direct calls?
- **Inter-service communication** - Process spawning, WebSockets, REST APIs
- **Performance optimization** - C++ for compute, Node.js for I/O, React for rendering
- **Real-time data streaming** - Backpressure handling, frame throttling
- **Design patterns** - Factory, Observer, Strategy, Command patterns across languages

## Documentation Index

### Architecture & Design

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - Overall system design, service boundaries, communication patterns
- [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md) - Gang of Four patterns and how we use them
- [PERFORMANCE_TRADEOFFS.md](./PERFORMANCE_TRADEOFFS.md) - Why we made specific architectural choices

### Code Standards

- [CPP_STANDARDS.md](./CPP_STANDARDS.md) - C++ coding conventions, RAII, smart pointers, memory management
- [TYPESCRIPT_STANDARDS.md](./TYPESCRIPT_STANDARDS.md) - TypeScript/NestJS patterns and best practices
- [TESTING_STANDARDS.md](./TESTING_STANDARDS.md) - Testing strategies across all services

### Frontend

- [UI_AESTHETIC.md](./UI_AESTHETIC.md) - Oscilloscope/Pip Boy retro-futuristic design guidelines
- [THREEJS_PATTERNS.md](./THREEJS_PATTERNS.md) - Three.js rendering optimization and patterns

### API & Communication

- [API_DESIGN.md](./API_DESIGN.md) - REST endpoint design, WebSocket protocols
- [WEBSOCKET_STREAMING.md](./WEBSOCKET_STREAMING.md) - Real-time streaming architecture

## Key Principles

1. **Separation of Concerns** - Each service has a single responsibility
2. **Type Safety** - Strong typing in C++, TypeScript, and across service boundaries
3. **Performance** - Right tool for the job (C++ for compute, Node.js for I/O)
4. **Reliability** - Graceful degradation, retry logic, error handling
5. **Observability** - Logging, monitoring, debugging across services

## Quick Reference

### Starting the System

```bash
# C++ simulation (standalone)
cd simulation-engine && ./sim --particles 100 --steps 1000 --seed 42

# Backend API
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev

# Full stack (Docker)
docker-compose up
```

### Common Development Tasks

- Adding a new simulation parameter → Update C++ CLI, backend DTO, frontend form
- Adding a new API endpoint → Update NestJS controller, create types, add tests
- Adding a new visualization mode → Update Three.js scene, add UI controls
- Optimizing performance → Profile each service independently, then integration test

## Contributing

When adding features or fixing bugs:

1. **Understand the full stack flow** - How does data move from user input → C++ → database → frontend?
2. **Consider tradeoffs** - Why this approach vs alternatives? Document in comments
3. **Test each layer** - Unit tests for logic, integration tests for services
4. **Update documentation** - If you learn something non-obvious, document it here

## Questions to Ask

As you work through the codebase, consider:

- **Why is this a separate service?** What would happen if we combined it with another?
- **Why use a queue here?** Could we make this synchronous? What do we gain/lose?
- **Why spawn a process?** Could we use a library? Native Node.js addon?
- **Why WebSockets?** Could we use HTTP polling? Server-Sent Events?
- **Why Three.js?** Could we use Canvas 2D? WebGL directly?

The answers to these questions reveal system design tradeoffs.

## Getting Help

- Check the relevant `.md` file in this directory for your question
- Look at code comments for implementation-specific details
- Review tests to understand expected behavior
- Ask questions about tradeoffs - that's the real learning

---

**Remember:** This is a learning project. The architecture is deliberately distributed to teach about system design. In a real-world scenario, you might make different tradeoffs based on scale, team size, and requirements.
