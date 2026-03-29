# Setup Instructions

## Prerequisites

Before running this project, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

## Installation Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Verify installation**:
   ```bash
   npm test
   ```

3. **Start development**:
   
   Frontend:
   ```bash
   npm run dev
   ```
   
   Backend (in a separate terminal):
   ```bash
   npm run backend:dev
   ```

## Troubleshooting

If you encounter issues:

1. **npm not found**: Install Node.js from https://nodejs.org/
2. **Permission errors**: Try running with administrator privileges or use `npx` instead
3. **Port conflicts**: The default ports are 5173 (frontend) and 3000 (backend). You can change these in the configuration files.

## Next Steps

After installation, you can:
- Run tests: `npm test`
- View test UI: `npm run test:ui`
- Build for production: `npm run build`
