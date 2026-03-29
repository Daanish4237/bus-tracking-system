# Tech Stack

## Language
- TypeScript (strict mode, ES2020 target)

## Frontend
- Vanilla TypeScript (no framework)
- Vite for bundling and dev server
- Entry point: `system.html`
- Path alias: `@/` maps to `./src/`

## Backend
- Node.js with Express
- Runs on port 3000 by default
- CORS enabled
- Frontend dev server proxies `/api` to `http://localhost:3000`

## Testing
- Vitest (test runner, globals enabled, jsdom environment)
- fast-check (property-based testing)
- Tests co-located with source files using `.test.ts` suffix
- Test glob: `src/**/*.test.ts`

## Common Commands

```bash
# Frontend dev server (http://localhost:5173)
npm run dev

# Backend dev server with hot reload (http://localhost:3000)
npm run backend:dev

# Run all tests (single pass)
npm test

# Run tests in watch mode
npm run test:watch

# Build frontend (outputs to dist/frontend/)
npm run build

# Build backend (outputs to dist/backend/)
npm run backend:build
```
