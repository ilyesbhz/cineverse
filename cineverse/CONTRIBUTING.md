# Contributing to Cineverse

Thank you for your interest in contributing to Cineverse! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

---

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Our Standards
- Use welcoming and inclusive language
- Be respectful of differing opinions
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites
- Node.js 14 or higher
- npm or yarn
- Git
- MongoDB (local or Atlas)
- Basic understanding of React and Express.js

### Fork & Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/cineverse.git
cd cineverse

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/cineverse.git
```

---

## Development Setup

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server Setup:**
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your local configuration:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/cineverse
JWT_SECRET=your_development_secret_key
TMDB_API_KEY=your_api_key
YOUTUBE_API_KEY=your_api_key
STRIPE_SECRET_KEY=sk_test_xxxxx
CLIENT_URL=http://localhost:3000
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The application should be accessible at `http://localhost:3000`

---

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Build, dependencies, tooling

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Ensure your changes don't break existing functionality

### 3. Test Your Changes

```bash
# Backend tests (if available)
cd server
npm test

# Frontend tests (if available)
cd ../client
npm test
```

Manually test the feature:
1. Run both servers in development mode
2. Test in browser at `http://localhost:3000`
3. Verify responsive design on mobile
4. Check browser console for errors

---

## Code Style

### JavaScript/React Standards

#### File Naming
- Components: `PascalCase` (e.g., `ReelCard.js`)
- Utilities: `camelCase` (e.g., `apiService.js`)
- Tests: `filename.test.js` or `filename.spec.js`

#### Component Structure
```javascript
import React from 'react';
import './ComponentName.css';

const ComponentName = ({ prop1, prop2 }) => {
  // Hooks first
  const [state, setState] = React.useState(null);
  
  // Effects
  React.useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);
  
  // Handlers
  const handleClick = () => {};
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

#### Backend Structure
```javascript
// Controller
export const functionName = async (req, res) => {
  try {
    // Validation
    // Logic
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Formatting Standards

- **Indentation**: 2 spaces (not tabs)
- **Line Length**: Maximum 100 characters
- **Quotes**: Double quotes for strings
- **Semicolons**: Use semicolons
- **Trailing Commas**: Use in multi-line objects/arrays

### CSS Standards

- Use CSS custom properties (variables) from `:root`
- Follow BEM naming convention when appropriate
- Mobile-first responsive design
- Use existing color variables: `--red`, `--text`, `--border`, etc.

```css
/* Good */
.component-name {
  color: var(--text);
  background: var(--card);
}

.component-name__header {
  padding: var(--spacing-md);
}
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Code style changes (no logic)
- **refactor**: Code refactoring
- **test**: Adding/updating tests
- **chore**: Dependencies, tooling, config

### Examples

```bash
git commit -m "feat(auth): add two-factor authentication"
git commit -m "fix(reel): resolve video playback issue on Safari"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(api): simplify error handling middleware"
```

### Commit Best Practices

- **Atomic commits**: One logical change per commit
- **Clear messages**: Write descriptive commit messages
- **Reference issues**: Include issue numbers in commits
  ```bash
  git commit -m "fix(discussions): prevent XSS attacks (#123)"
  ```
- **No merge commits**: Use rebase to keep history clean
  ```bash
  git rebase upstream/main
  ```

---

## Pull Request Process

### Before Submitting

1. **Update your branch with latest changes:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests and linting:**
   ```bash
   # Backend
   cd server && npm test
   
   # Frontend  
   cd ../client && npm test
   ```

3. **Build check:**
   ```bash
   cd client && npm run build
   ```

4. **Manual testing**: Verify all changes work as expected

### Submitting a Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub** with:
   - **Title**: Clear, concise description (e.g., "Add achievement badges to comments")
   - **Description**: 
     - What changed and why
     - Related issue numbers (closes #123)
     - Testing performed
     - Screenshots if UI changes
   - **Reviewers**: Assign relevant team members

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] All tests passing
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### PR Review Process

1. **Address feedback**: Respond to reviewer comments
2. **Make changes**: Commit changes following guidelines
3. **Re-request review**: After addressing all comments
4. **Approval**: PR requires approval before merging
5. **Merge**: Squash commits to main branch

---

## Reporting Issues

### Bug Report Template

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
[If applicable]

## Environment
- OS: Windows 11
- Browser: Chrome 120
- Node version: 18.0.0
- React version: 18.3
```

### Issue Title Format
- **Bug**: `[BUG] Brief description` 
- **Feature**: `[FEATURE] Brief description`
- **Question**: `[QUESTION] Brief description`

---

## Feature Requests

### Feature Request Template

```markdown
## Description
Clear description of the requested feature

## Use Case
Why do you need this feature?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Other approaches considered?

## Additional Context
Any other information?
```

---

## Review Expectations

### What Reviewers Look For
- ✅ Code quality and maintainability
- ✅ Testing coverage
- ✅ Documentation
- ✅ Performance impact
- ✅ Security considerations
- ✅ Backward compatibility

### Reviewer Responsibilities
- Provide constructive feedback
- Suggest improvements
- Check code quality
- Ensure tests pass
- Verify documentation

---

## Questions?

- Check existing [issues](https://github.com/yourusername/cineverse/issues)
- Review [documentation](README.md)
- Start a [discussion](https://github.com/yourusername/cineverse/discussions)
- Contact the team

---

## Thank You! 🎬

Your contributions make Cineverse better. Thank you for helping improve the project!

---

**Happy Contributing!**
