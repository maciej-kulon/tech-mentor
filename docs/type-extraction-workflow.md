# Type Extraction Workflow

## Overview

This project uses an automated GitHub workflow to extract TypeScript types and API endpoints from the NestJS backend and generate frontend-ready interfaces. The workflow runs automatically when changes are made to DTOs, enums, or controllers in feature branches.

## How It Works

### Trigger Conditions

The workflow (`extract-types.yml`) automatically runs when:

1. **Branch Pattern**: Commits are pushed to branches matching these patterns:

   - `feature/**` - Feature branches
   - `feat/**` - Feature branches (alternative naming)
   - `bugfix/**` - Bug fix branches
   - `fix/**` - Fix branches
   - `hotfix/**` - Hotfix branches
   - `release/**` - Release branches

2. **File Changes**: The commit includes changes to:
   - `backend/src/**/*.dto.ts` - DTO files
   - `backend/src/**/*.enum.ts` - Enum files
   - `backend/src/**/*.controller.ts` - Controller files
   - `backend/scripts/extract-*.js` - Extraction scripts

### Process

1. **Setup**: The workflow checks out the code and sets up Node.js 22.14.0
2. **Install Dependencies**: Installs backend npm dependencies
3. **Extract Types**: Runs both extraction scripts:
   - `extract-types.js` - Converts DTOs to TypeScript interfaces
   - `extract-endpoints.js` - Generates API endpoint constants
4. **Commit Changes**: If new types are generated, commits them back to the feature branch
5. **Skip CI**: Uses `[skip ci]` in commit message to prevent infinite loops

## Generated Files

The workflow generates files in `web/src/types/generated/`:

- `*.types.ts` - TypeScript interfaces from DTOs
- `api-endpoints.ts` - API endpoint constants
- `index.ts` - Barrel export file

## Usage for Developers

### Creating Feature Branches

When working on features that modify backend types:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes to DTOs, enums, or controllers
3. Commit and push your changes
4. The workflow will automatically run and commit generated types

### Manual Execution

If you need to run the extraction manually:

```bash
cd backend
npm run extract-all
```

### Testing Extraction Locally

Before pushing to GitHub, you can test the extraction process locally:

```bash
cd backend
npm run test-extraction
```

This will:

- Run the extraction scripts
- Verify generated files exist
- Check TypeScript syntax
- Provide a summary of what was generated

### Checking Generated Types

After the workflow runs, check the generated files:

```bash
ls web/src/types/generated/
```

### Importing Types in Frontend

Import the generated types in your React components:

```typescript
import { User, Project } from "../types/generated";
import { API } from "../types/generated/api-endpoints";

// Use the types
const user: User = {
  /* ... */
};
const projectUrl = API.GET_PROJECTS_PROJECT_ID(projectId);
```

## Workflow Benefits

1. **Type Safety**: Frontend always has up-to-date types matching the backend
2. **Automation**: No manual type generation required
3. **Consistency**: Ensures types stay in sync across the stack
4. **Developer Experience**: Immediate feedback when types change

## Troubleshooting

### Workflow Not Running

- Ensure your branch name matches the trigger patterns
- Check that you modified files in the watched paths
- Verify the workflow file exists in `.github/workflows/`

### Types Not Generated

- Check the workflow logs for errors
- Ensure backend dependencies are properly installed
- Verify the extraction scripts are working locally

### Infinite Loop

The workflow uses `[skip ci]` in commit messages to prevent infinite loops. If you see repeated runs, check that the commit message includes this tag.

### Workflow Not Triggering

- Ensure your branch name matches the trigger patterns (e.g., `feature/my-feature`)
- Check that you modified files in the watched paths (DTOs, enums, controllers)
- Verify the workflow file exists in `.github/workflows/extract-types.yml`

### Types Not Updating

- Run `npm run test-extraction` locally to verify the scripts work
- Check the workflow logs for any errors
- Ensure backend dependencies are properly installed
- Verify the extraction scripts are working correctly

### Permission Issues

The workflow requires `contents: write` permission to commit generated types. This is automatically provided by the `GITHUB_TOKEN` secret.

## Configuration

The workflow uses the same Node.js version and npm cache settings as the release workflow for consistency.

## Related Files

- `.github/workflows/extract-types.yml` - Workflow definition
- `backend/scripts/extract-types.js` - DTO to interface converter
- `backend/scripts/extract-endpoints.js` - Controller to endpoint converter
- `backend/package.json` - Scripts: `extract-types`, `extract-endpoints`, `extract-all`
