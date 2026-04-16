# Contributing Guidelines

## Development Workflow

### Branch Strategy

All development happens on feature branches. Direct commits to `main` are not allowed.

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `infra/` - Infrastructure changes
- `docs/` - Documentation updates

### Creating a Pull Request

```bash
# Create feature branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description"

# Push and create PR
git push origin feature/your-feature-name
```

### Pre-Commit Checks

Husky runs the following checks before each commit:

1. **Linting** - ESLint with zero warnings allowed
2. **Type checking** - TypeScript compilation
3. **Tests** - All unit tests must pass
4. **Formatting** - Prettier format validation

If any check fails, the commit is blocked. Fix the issues and try again.

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Test updates
- `docs` - Documentation
- `chore` - Maintenance

**Examples:**
```
feat: add WebSocket streaming endpoint
fix: handle job retry backoff correctly
test: add integration tests for job lifecycle
```

### Pull Request Process

1. Ensure all tests pass locally
2. Push branch to remote
3. Create PR with clear description
4. Wait for CI/CD checks to pass
5. Request code review
6. Address feedback
7. Merge when approved

### Code Quality Standards

**Backend (TypeScript/NestJS):**
- Use dependency injection
- Implement proper error handling
- Write unit tests for services and controllers
- Use DTOs with class-validator
- Follow existing code patterns

**Simulation Engine (C++):**
- Follow C++17 standards
- Use RAII for resource management
- Add tests for new physics features
- Maintain deterministic behavior
- Document performance implications

### Running Tests

```bash
# Full test suite
./scripts/test.sh

# Backend tests only
cd backend && npm test

# C++ tests only
cd simulation-engine && ./test.sh
```

### Development Environment

```bash
# Start infrastructure (PostgreSQL, Redis)
docker-compose -f docker-compose.dev.yml up -d

# Start backend
cd backend && npm run start:dev

# Stop infrastructure
docker-compose -f docker-compose.dev.yml down
```

### Questions or Issues?

Open an issue on GitHub with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
