# BotPass Development Rules

This document outlines key rules and best practices for development on the BotPass project.

## Pre-Push Checklist

Before pushing changes to the repository, ensure you:

1. ✅ **Run a production build locally**: 
   ```bash
   npm run build
   ```
   This is critical to catch TypeScript errors and other build issues early. Production builds have stricter type checking than development mode.

2. ✅ **Run all tests**:
   ```bash
   npm test
   ```

3. ✅ **Lint your code**:
   ```bash
   npm run lint
   ```

## TypeScript Guidelines

- Always define proper types for variables, function parameters, and return values
- Avoid using `any` type unless absolutely necessary
- Use TypeScript's built-in utility types when appropriate
- Remove unused imports to prevent build errors

## Component Development

- Follow the project's component structure
- Use functional components with hooks
- Ensure components are properly typed
- Make components reusable and maintainable
- Document props with JSDoc comments

## State Management

- Use React Context for global state
- Use useState and useReducer for component-level state
- Avoid prop drilling by using context or custom hooks

## Routing

- Define all routes in the App.tsx file
- Use route parameters for dynamic content
- Implement proper navigation guards where needed

## Error Handling

- Implement proper error boundaries
- Use try/catch blocks for async operations
- Log meaningful error messages
- Provide user-friendly error messages in the UI

## Performance Considerations

- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect and other hooks
- Avoid unnecessary re-renders
- Use lazy loading for components when appropriate

## Accessibility

- Ensure all UI elements are keyboard accessible
- Use semantic HTML elements
- Include proper ARIA attributes
- Test with screen readers

## Deployment Considerations

- Ensure all environment variables are properly set
- Test the build locally before deployment
- Follow the deployment checklist in the deployment documentation

Remember: Following these rules helps maintain code quality and prevents deployment issues! 