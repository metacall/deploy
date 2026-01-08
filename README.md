<p align="center">
  <a href="https://metacall.io/" target="_blank">
    <img src="https://github.com/metacall.png" width="28%" alt="MetaCall Logo">
  </a>
</p>

<h1 align="center"><b>MetaCall FaaS Deploy CLI</b></h1>

<p align="center">
  <b>Modern CLI tool for deploying serverless functions to the MetaCall FaaS platform</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@metacall/deploy">
    <img src="https://img.shields.io/npm/v/@metacall/deploy?color=blue&label=npm" alt="NPM Version">
  </a>
  <a href="https://github.com/metacall/deploy/actions">
    <img src="https://github.com/metacall/deploy/actions/workflows/ci.yml/badge.svg" alt="CI Status">
  </a>
  <a href="https://packagephobia.com/result?p=@metacall/deploy">
    <img src="https://packagephobia.com/badge?p=@metacall/deploy" alt="Install Size">
  </a>
  <a href="https://discord.com/channels/781987805974757426/">
    <img src="https://img.shields.io/discord/781987805974757426?color=purple&style=plastic" alt="Discord">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License">
  </a>
</p>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Commands Reference](#-commands-reference)
  - [deploy](#deploy)
  - [inspect](#inspect)
  - [delete](#delete)
  - [plans](#plans)
  - [logs](#logs)
  - [login](#login)
  - [logout](#logout)
  - [version](#version)
- [Configuration](#-configuration)
- [Mock Mode](#-mock-mode)
- [Troubleshooting](#-troubleshooting)
- [Migration Guide](#-migration-guide)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 About

**MetaCall Deploy CLI** is a modern, TypeScript-based command-line interface for deploying serverless functions and applications to the [MetaCall FaaS platform](https://metacall.io/). Built with clean architecture principles and OOP design patterns, it provides a robust, extensible, and maintainable solution for serverless deployments.

### Version 2.0.0 Highlights

Version 2.0.0 represents a complete rewrite with significant improvements:

- ✅ **Modern subcommand-based CLI structure** - Intuitive command organization
- ✅ **OOP architecture** - Clean design patterns for maintainability
- ✅ **Enhanced error handling** - Comprehensive validation and error messages
- ✅ **Visual progress indicators** - Real-time deployment feedback
- ✅ **Mock mode support** - Test without API access
- ✅ **Comprehensive documentation** - Extensive guides and examples
- ✅ **TypeScript-first** - Full type safety and IntelliSense support

---

## ✨ Features

- 🎯 **Multiple Deployment Sources**
  - Deploy from local directories
  - Deploy directly from Git repositories
  - Support for various package formats

- 🔐 **Authentication & Security**
  - Token-based authentication
  - Secure credential storage
  - Environment variable support

- 📊 **Deployment Management**
  - List and inspect deployments
  - View real-time logs
  - Delete deployments
  - Force deployment option

- 🎨 **Developer Experience**
  - Interactive prompts
  - Progress indicators
  - Colorized output
  - Multiple output formats (table, JSON, OpenAPI)

- 🧪 **Testing & Development**
  - Mock mode for offline testing
  - Development server support
  - CI/CD friendly

- 📦 **Subscription Plans**
  - View available plans
  - Interactive plan selection
  - Plan-based deployment limits

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 14.0.0
- **npm**, **yarn**, or **pnpm**

### Global Installation

#### Using npm

```bash
npm install -g @metacall/deploy
```

#### Using yarn

```bash
yarn global add @metacall/deploy
```

#### Using pnpm

```bash
pnpm add -g @metacall/deploy
```

### Verify Installation

```bash
metacall-deploy --version
```

Expected output: `2.0.0` (or your installed version)

---

## 🏃 Quick Start

### 1. Authenticate

First, authenticate with MetaCall using your credentials:

```bash
# Using email and password
metacall-deploy login --email your@email.com --password yourpassword

# Or using an API token
metacall-deploy login --token your-api-token
```

> 💡 **Tip**: You can also set the `METACALL_API_KEY` environment variable instead of using the login command.

### 2. Deploy Your First Application

#### Deploy from Local Directory

```bash
metacall-deploy deploy --workdir ./my-app --name my-first-app
```

#### Deploy from Git Repository

```bash
metacall-deploy deploy --repo https://github.com/user/repo.git --name my-app
```

### 3. Check Your Deployments

```bash
metacall-deploy inspect
```

### 4. View Logs

```bash
metacall-deploy logs --id <deployment-id>
```

---

## 📚 Commands Reference

### `deploy`

Deploy a package or repository to MetaCall FaaS.

#### Syntax

```bash
metacall-deploy deploy [options]
```

#### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--workdir <path>` | Path to application directory | No* | Current directory |
| `--repo <url>` | Git repository URL | No* | - |
| `--name <name>` | Project name | No | Directory name |
| `--plan <plan>` | Subscription plan (Essential, Standard, Premium) | No | Essential |
| `--force` | Force deployment (delete existing deployment) | No | false |
| `--dev` | Use development server | No | false |
| `--mock` | Use mock protocol service | No | false |

\* Either `--workdir` or `--repo` is required.

#### Examples

```bash
# Deploy from current directory
metacall-deploy deploy --name my-app

# Deploy from specific directory
metacall-deploy deploy --workdir ./src/app --name my-app

# Deploy from Git repository
metacall-deploy deploy --repo https://github.com/user/repo.git --name my-app

# Deploy with specific plan
metacall-deploy deploy --workdir ./app --name my-app --plan Premium

# Force deployment (overwrites existing)
metacall-deploy deploy --workdir ./app --name my-app --force

# Deploy to development server
metacall-deploy deploy --workdir ./app --name my-app --dev

# Deploy in mock mode (for testing)
metacall-deploy deploy --workdir ./app --name my-app --mock
```

#### Common Use Cases

**Deploy a Node.js application:**
```bash
cd my-node-app
metacall-deploy deploy --name my-node-app
```

**Deploy a Python application:**
```bash
metacall-deploy deploy --workdir ./python-app --name my-python-app
```

**Deploy from a private Git repository:**
```bash
metacall-deploy deploy --repo git@github.com:user/private-repo.git --name my-app
```

---

### `inspect`

List and inspect all deployments.

#### Syntax

```bash
metacall-deploy inspect [options]
```

#### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--format <format>` | Output format (table, json, openapi) | No | table |
| `--watch` | Auto-refresh every 5 seconds | No | false |
| `--dev` | Use development server | No | false |
| `--mock` | Use mock protocol service | No | false |

#### Examples

```bash
# List deployments in table format (default)
metacall-deploy inspect

# List deployments in JSON format
metacall-deploy inspect --format json

# List deployments in OpenAPI format
metacall-deploy inspect --format openapi

# Watch deployments (auto-refresh)
metacall-deploy inspect --watch

# Inspect mock deployments
metacall-deploy inspect --mock
```

#### Output Formats

- **table**: Human-readable table format (default)
- **json**: JSON format for scripting and automation
- **openapi**: OpenAPI v3 specification format

---

### `delete`

Delete a deployment.

#### Syntax

```bash
metacall-deploy delete [options]
```

#### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--id <id>` | Deployment ID to delete | Yes | - |
| `--mock` | Use mock protocol service | No | false |

#### Examples

```bash
# Delete a deployment
metacall-deploy delete --id abc123def456

# Delete a mock deployment
metacall-deploy delete --id mock-deployment-id --mock
```

> ⚠️ **Warning**: This action cannot be undone. Make sure you have the correct deployment ID.

---

### `plans`

List available subscription plans and their features.

#### Syntax

```bash
metacall-deploy plans [options]
```

#### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--select` | Select a plan interactively | No | false |
| `--mock` | Use mock protocol service | No | false |

#### Examples

```bash
# List all available plans
metacall-deploy plans

# Interactively select a plan
metacall-deploy plans --select

# List mock plans
metacall-deploy plans --mock
```

#### Available Plans

- **Essential**: Basic plan with limited slots
- **Standard**: Standard plan with more slots
- **Premium**: Premium plan with maximum slots

---

### `logs`

View deployment logs in real-time.

#### Syntax

```bash
metacall-deploy logs [options]
```

#### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--id <id>` | Deployment ID | Yes | - |
| `--container <container>` | Container name | No | - |
| `--type <type>` | Log type (deploy or job) | No | deploy |
| `--dev` | Use development server | No | false |
| `--mock` | Use mock protocol service | No | false |

#### Examples

```bash
# View deployment logs
metacall-deploy logs --id abc123def456

# View logs for specific container
metacall-deploy logs --id abc123def456 --container node

# View job logs
metacall-deploy logs --id abc123def456 --type job

# View mock logs
metacall-deploy logs --id mock-deployment-id --mock
```

---

### `login`

Authenticate with MetaCall platform.

#### Syntax

```bash
metacall-deploy login [options]
```

#### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--email <email>` | Email address | No* | - |
| `--password <password>` | Password | No* | - |
| `--token <token>` | API token | No* | - |

\* Either email/password or token is required.

#### Examples

```bash
# Login with email and password
metacall-deploy login --email user@example.com --password mypassword

# Login with API token
metacall-deploy login --token your-api-token-here
```

> 💡 **Tip**: For CI/CD pipelines, use the `METACALL_API_KEY` environment variable instead.

---

### `logout`

Log out and clear authentication token.

#### Syntax

```bash
metacall-deploy logout
```

#### Examples

```bash
# Log out
metacall-deploy logout
```

This command removes the stored authentication token from your configuration file.

---

### `version`

Display CLI version information.

#### Syntax

```bash
metacall-deploy version
# or
metacall-deploy --version
# or
metacall-deploy -v
```

#### Examples

```bash
metacall-deploy version
```

Output: `2.0.0`

---

## ⚙️ Configuration

### Configuration File Location

The CLI stores configuration in the following locations:

- **Unix/Linux/macOS**: `$HOME/.metacall/deploy/config.ini`
- **Windows**: `%APPDATA%\metacall\deploy\config.ini`

### Configuration File Format

The configuration file uses INI format:

```ini
baseURL=https://dashboard.metacall.io
apiURL=https://api.metacall.io
devURL=http://localhost:9000
renewTime=1296000000
token=your-authentication-token-here
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `baseURL` | Dashboard base URL | `https://dashboard.metacall.io` |
| `apiURL` | API base URL | `https://api.metacall.io` |
| `devURL` | Development server URL | `http://localhost:9000` |
| `renewTime` | Token renewal time (milliseconds) | `1296000000` (15 days) |
| `token` | Authentication token | - |

### Environment Variables

You can override configuration using environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `METACALL_API_KEY` | Override authentication token | `export METACALL_API_KEY=your-token` |
| `CI` | Automatically detected for non-interactive mode | `export CI=true` |
| `METACALL_MOCK_MODE` | Enable mock mode | `export METACALL_MOCK_MODE=true` |

### Custom Configuration Directory

You can specify a custom configuration directory:

```bash
metacall-deploy deploy --confDir /custom/path --workdir ./app --name my-app
```

### Custom Server URL

You can specify a custom server URL:

```bash
metacall-deploy deploy --serverUrl https://custom-api.example.com --workdir ./app --name my-app
```

---

## 🧪 Mock Mode

Mock mode allows you to run the CLI without making real API calls, making it perfect for testing, development, and demonstrations.

### Activation Methods

Mock mode can be activated in two ways:

1. **CLI Flag**: Use the `--mock` flag with any command
   ```bash
   metacall-deploy deploy --mock --workdir ./app --name my-app
   ```

2. **Environment Variable**: Set `METACALL_MOCK_MODE=true`
   ```bash
   export METACALL_MOCK_MODE=true
   metacall-deploy deploy --workdir ./app --name my-app
   ```

> **Note**: The CLI flag takes precedence over the environment variable.

### Mock Mode Behavior

When mock mode is enabled:

- ✅ **No real API calls** - All operations use in-memory state
- ✅ **Authentication bypassed** - No token required
- ✅ **Session persistence** - Deployments persist during the CLI session
- ✅ **Realistic responses** - Mock service returns data matching real API structure
- ✅ **State management** - Deployments, plans, and logs maintained in memory

### Mock Data

The mock service initializes with default data:

- **Plans**: 
  - Free (1 slot)
  - Standard (2 slots)
  - Enterprise (0 slots)
- **Deployments**: Empty initially, created as you deploy
- **Logs**: Generated automatically for each deployment

### Usage Examples

```bash
# Deploy in mock mode
metacall-deploy deploy --mock --workdir ./app --name my-app

# Inspect mock deployments
metacall-deploy inspect --mock

# List mock plans
metacall-deploy plans --mock

# View mock logs
metacall-deploy logs --id mock-deployment-id --mock

# Delete mock deployment
metacall-deploy delete --id mock-deployment-id --mock
```

### Limitations

- ❌ Mock state is **not persisted** between CLI sessions
- ❌ Mock mode does **not** simulate network errors or edge cases by default
- ⚠️ Login/signup operations still make real API calls (authentication is separate)

### Use Cases

- 🧪 **Testing**: Test CLI workflows without API access
- 💻 **Development**: Develop and iterate offline
- 🎬 **Demos**: Create demonstrations without requiring API credentials
- 🔄 **CI/CD**: Test CLI integration in CI pipelines without API dependencies

---

## 🔧 Troubleshooting

### Common Issues

#### Authentication Errors

**Problem**: `Authentication failed` or `Invalid token`

**Solutions**:
1. Verify your token is correct:
   ```bash
   metacall-deploy login --token your-token
   ```
2. Check if token has expired and regenerate it
3. Ensure `METACALL_API_KEY` environment variable is set correctly

#### Deployment Failures

**Problem**: `Deployment failed` or timeout errors

**Solutions**:
1. Check your internet connection
2. Verify the deployment package is valid
3. Check deployment logs:
   ```bash
   metacall-deploy logs --id <deployment-id>
   ```
4. Try using `--force` flag to overwrite existing deployment
5. Check if you have available slots in your plan:
   ```bash
   metacall-deploy plans
   ```

#### Configuration Issues

**Problem**: Configuration file not found or invalid

**Solutions**:
1. Verify configuration file exists in the correct location
2. Check file permissions
3. Use `--confDir` to specify custom configuration directory
4. Re-authenticate to regenerate configuration:
   ```bash
   metacall-deploy logout
   metacall-deploy login --token your-token
   ```

#### Network Errors

**Problem**: Connection timeout or network errors

**Solutions**:
1. Check your internet connection
2. Verify API endpoints are accessible
3. Check firewall/proxy settings
4. Try using `--dev` flag for development server
5. Use mock mode for offline testing:
   ```bash
   metacall-deploy deploy --mock --workdir ./app --name my-app
   ```

#### Permission Errors

**Problem**: Permission denied errors

**Solutions**:
1. Check file/directory permissions
2. Ensure you have write access to configuration directory
3. On Unix/Linux/macOS, check `$HOME/.metacall/deploy/` permissions
4. On Windows, check `%APPDATA%\metacall\deploy\` permissions

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/metacall/deploy/issues)
2. Join our [Discord community](https://discord.com/channels/781987805974757426/)
3. Review the [MetaCall Documentation](https://metacall.io/doc.html)

### Debug Mode

Enable verbose logging for debugging:

```bash
metacall-deploy deploy --verbose --workdir ./app --name my-app
```

---

## 🔄 Migration Guide

### Breaking Changes in v2.0.0

Version 2.0.0 introduces a complete rewrite with a new subcommand-based structure. The old flag-based syntax is **not supported**.

### Migration Overview

| Old (v0.1.33) | New (v2.0.0) |
|---------------|--------------|
| Flag-based commands | Subcommand-based structure |
| `--workdir` as main flag | `deploy --workdir` |
| `--inspect` flag | `inspect` command |
| `--delete` flag | `delete` command |
| `--listPlans` flag | `plans` command |

### Detailed Migration Examples

#### Authentication

```bash
# Old
metacall-deploy --email <email> --password <pwd>
metacall-deploy --token <token>
metacall-deploy --logout

# New
metacall-deploy login --email <email> --password <pwd>
metacall-deploy login --token <token>
metacall-deploy logout
```

#### Deployment

```bash
# Old
metacall-deploy --workdir ./app
metacall-deploy --workdir ./app --projectName my-app
metacall-deploy --addrepo <url>
metacall-deploy --workdir ./app --plan Essential
metacall-deploy --workdir ./app --force
metacall-deploy --workdir ./app --dev

# New
metacall-deploy deploy --workdir ./app
metacall-deploy deploy --workdir ./app --name my-app
metacall-deploy deploy --repo <url>
metacall-deploy deploy --workdir ./app --plan Essential
metacall-deploy deploy --workdir ./app --force
metacall-deploy deploy --workdir ./app --dev
```

#### Inspection & Management

```bash
# Old
metacall-deploy --inspect
metacall-deploy --inspect Raw
metacall-deploy --inspect OpenAPIv3
metacall-deploy --delete
metacall-deploy --listPlans

# New
metacall-deploy inspect
metacall-deploy inspect --format json
metacall-deploy inspect --format openapi
metacall-deploy delete --id <id>
metacall-deploy plans
```

#### New Commands

```bash
# New in v2.0.0
metacall-deploy logs --id <id>
metacall-deploy version
```

### Key Changes Summary

1. **Subcommand Structure**: All actions are now subcommands
2. **Renamed Flags**:
   - `--addrepo` → `--repo` (under `deploy` command)
   - `--projectName` → `--name` (under `deploy` command)
   - `--listPlans` → `plans` command
3. **New Commands**: `login`, `logs`
4. **Improved Help**: Each command has its own help (`metacall-deploy <command> --help`)

### Backward Compatibility

- ❌ Old flag-based syntax is **not supported**
- ✅ Configuration file format remains the same
- ✅ Existing authentication tokens continue to work

---

## 🏗️ Architecture

The CLI is built with modern OOP design patterns for maintainability and extensibility:

### Design Patterns

- **Command Pattern** - Each CLI command is a class implementing a common interface
- **Strategy Pattern** - Different deployment strategies (Package vs Repository)
- **Factory Pattern** - Command and service creation
- **Service Layer Pattern** - Business logic abstraction
- **Builder Pattern** - Configuration building
- **Template Method Pattern** - Standardized command execution

### Project Structure

```
src/
├── builders/          # Configuration builders
├── commands/          # CLI command implementations
│   ├── base/         # Base command classes
│   └── clipanion/    # Clipanion-based commands
├── config/           # Configuration management
├── constants/        # Application constants
├── errors/           # Custom error classes
├── factories/        # Factory classes
├── schemas/          # Validation schemas
├── services/         # Business logic services
│   ├── auth/        # Authentication services
│   ├── deployment/  # Deployment services
│   ├── plan/        # Plan services
│   └── protocol/    # Protocol services
├── strategies/       # Deployment strategies
├── tasks/            # Task definitions
├── types/            # TypeScript type definitions
├── ui/               # UI components (progress, tables)
└── utils/            # Utility functions
```

### Key Components

- **Commands**: Handle user input and orchestrate operations
- **Services**: Implement business logic and API interactions
- **Strategies**: Define deployment strategies (local vs repository)
- **Builders**: Construct complex configuration objects
- **UI Components**: Provide user feedback and progress indicators

For detailed architecture documentation, see [docs/oop-architecture.md](docs/oop-architecture.md) (if available).

---

## 🚦 Exit Codes

The CLI uses the following exit codes:

| Exit Code | Description | Example |
|-----------|-------------|---------|
| `0` | Success | Command completed successfully |
| `1` | Validation error | Invalid input parameters |
| `2` | Deployment error | Deployment failed |
| `3` | Authentication error | Invalid or expired token |
| `4` | Network error | Connection timeout |
| `5` | Configuration error | Missing or invalid configuration |
| `127` | Unknown command | Command not found |

---

## 📝 Ignore Files

Files listed in `.gitignore` are automatically excluded from deployment, just like Git. This ensures that:

- Build artifacts are not deployed
- Dependencies are not duplicated
- Sensitive files are excluded
- Only source code is deployed

Common ignored files:
- `node_modules/`
- `dist/`, `build/`
- `.env`, `.env.local`
- `*.log`
- `.git/`

---

## 🆕 New to MetaCall?

### Getting Started

1. **Create an Account**
   - Visit [dashboard.metacall.io](https://dashboard.metacall.io)
   - Sign up for a free account

2. **Get Your API Token**
   - Navigate to your account settings
   - Generate an API token
   - Copy the token for use with the CLI

3. **Choose a Plan**
   - Review available plans: `metacall-deploy plans`
   - Select a plan that fits your needs
   - Upgrade as your usage grows

4. **Start Deploying**
   - Authenticate: `metacall-deploy login --token <your-token>`
   - Deploy your first app: `metacall-deploy deploy --workdir ./app --name my-app`

### Learn More

- 📚 [MetaCall Documentation](https://metacall.io/doc.html)
- 📖 [FaaS Subscription Plans](https://metacall.io/doc.html#/faas/subs-plans)
- 💬 [Discord Community](https://discord.com/channels/781987805974757426/)
- 🐛 [Report Issues](https://github.com/metacall/deploy/issues)

---

## 🤝 Contributing

We welcome contributions! This project follows best practices and maintains high code quality standards.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/metacall/deploy.git
cd deploy

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run build:watch` | Watch mode for development |
| `npm run test` | Run test suite |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run typecheck` | Type check without emitting |
| `npm run clean` | Remove build artifacts |

### Code Quality

- ✅ TypeScript strict mode enabled
- ✅ ESLint for code quality
- ✅ Prettier for code formatting
- ✅ Comprehensive error handling
- ✅ Type-safe throughout

### Open in Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/metacall/deploy)

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run check`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines (if available).

---

## 📄 License

This project is licensed under the **Apache License 2.0**.

See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ by the MetaCall team
- Powered by [Clipanion](https://github.com/arcanis/clipanion) for CLI framework
- Uses [@metacall/protocol](https://www.npmjs.com/package/@metacall/protocol) for API communication

---

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/metacall/deploy/issues)
- 💬 **Discord**: [Join our community](https://discord.com/channels/781987805974757426/)
- 📧 **Email**: Contact through [MetaCall website](https://metacall.io/)
- 📚 **Documentation**: [MetaCall Docs](https://metacall.io/doc.html)

---

<p align="center">
  <b>Made with ❤️ by the MetaCall Team</b>
</p>

<p align="center">
  <a href="https://metacall.io/">Website</a> •
  <a href="https://github.com/metacall/deploy">GitHub</a> •
  <a href="https://www.npmjs.com/package/@metacall/deploy">NPM</a> •
  <a href="https://discord.com/channels/781987805974757426/">Discord</a>
</p>
