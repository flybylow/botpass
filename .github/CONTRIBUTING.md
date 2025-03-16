# Contributing to BotPass

Thank you for considering contributing to BotPass! This document outlines the process for contributing to the project.

## Development Process

1. **Fork the Repository**: Start by forking the repository to your GitHub account.

2. **Create a Branch**: Create a branch for your feature or bugfix.
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
3. **Make Changes**: Implement your changes with appropriate tests and documentation.

4. **Run a Production Build Locally**: Before pushing, run a production build locally to catch TypeScript errors and other build issues early.
   ```bash
   npm run build
   ```
   
   This is particularly important as TypeScript rules in production builds are stricter than in development environments.

5. **Commit Your Changes**: Use clear and descriptive commit messages.
   ```bash
   git commit -m "feat: add new feature X"
   ```

6. **Push to Your Branch**: Push your changes to your forked repository.
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**: Open a pull request against the main repository.

## Code Style and Standards

- Follow the existing code style in the project
- Write clear, self-documenting code
- Include appropriate comments when necessary
- Follow TypeScript best practices
- Test your code thoroughly

## Reporting Bugs

Please use the GitHub Issues feature to report bugs. Include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or error messages if applicable
- Environment information (browser, OS, etc.)

## Feature Requests

Feature requests are welcome! Please use GitHub Issues to suggest new features. Clearly describe:

- What you want to achieve
- Why this would be valuable
- How you envision it working

Thank you for contributing to BotPass! 