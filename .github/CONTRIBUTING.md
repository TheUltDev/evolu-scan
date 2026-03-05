# Contributing to Evolu Scan

First off, thanks for taking the time to contribute! ❤️

## Table of Contents

- [Contributing to Evolu Scan](#contributing-to-evolu-scan)
  - [Table of Contents](#table-of-contents)
  - [Project Structure](#project-structure)
  - [Development Setup](#development-setup)
  - [Contributing Guidelines](#contributing-guidelines)
    - [Commits](#commits)
    - [Pull Request Process](#pull-request-process)
    - [Development Workflow](#development-workflow)
  - [Getting Help](#getting-help)

## Development Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/evoluhq/evolu-scan.git
   cd evolu-scan
   pnpm install
   ```

2. **Build packages**
   ```bash
   pnpm build
   ```

3. **Build and watch packages**
   ```bash
   pnpm dev
   ```
   - This starts the scan package build in watch mode (CSS + rolldown).

4. **Running the demo app**
   ```bash
   cd demo
   pnpm dev
   ```
   - Opens a Vite dev server with a React app that imports `@evolu/scan`. Use this to test changes locally.
   - Make sure to run `pnpm build` (or `pnpm dev` from the root) at least once before starting the demo so the scan package is built.

## Contributing Guidelines

### Commits

We use conventional commits to ensure consistent commit messages:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `test:` Adding or updating tests
- `refactor:` Code changes that neither fix bugs nor add features

Example: `fix(scan): fix a typo`

### Pull Request Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes using conventional commits
4. Push to your branch
5. Open a Pull Request
6. Ask for reviews (@pivanov, @RobPruzan are your friends in this journey)

### Development Workflow

1. **TypeScript**
   - All code must be written in TypeScript
   - Ensure strict type checking passes
   - No `any` types unless absolutely necessary

2. **Code Style**
   - We use Biome for formatting and linting
   - Run `pnpm format` to format code
   - Run `pnpm lint` to check for issues

3. **Documentation**
   - Update relevant documentation
   - Add JSDoc comments for public APIs
   - Update README if needed

## Getting Help
- Check existing issues
- Create a new issue

<br />

⚛️ Happy coding! 🚀
