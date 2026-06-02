# Build Project Workflow

Follow these steps to install dependencies, typecheck, and build the Next.js web application.

## Steps

1. **Verify Node.js Environment**
   Ensure Node.js version is `>= 20.x.x`:
   ```bash
   node --version
   ```

2. **Install Dependencies**
   Run the installation command (on Windows, use `cmd.exe /c` to bypass PowerShell script execution policy if needed):
   ```bash
   cmd.exe /c npm install
   ```

3. **Run TypeScript Typecheck**
   Verify that there are no type errors in the codebase:
   ```bash
   cmd.exe /c npm run typecheck
   ```

4. **Build the Application**
   Compile and optimize the Next.js production build:
   ```bash
   cmd.exe /c npm run build
   ```
