/**
 * Development script to run both backend and frontend concurrently
 */

// Colors for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

console.log(
  `${colors.bright}${colors.green}🚀 Starting development servers...${colors.reset}\n`,
);

// Start backend server
const backendProcess = new Deno.Command('deno', {
  args: [
    'run',
    '--allow-net',
    '--allow-read',
    '--allow-env',
    '--watch',
    'backend/main.ts',
  ],
  stdout: 'inherit',
  stderr: 'inherit',
});

// Start frontend server
const frontendProcess = new Deno.Command('deno', {
  args: ['task', 'start'],
  cwd: './frontend',
  stdout: 'inherit',
  stderr: 'inherit',
});

console.log(
  `${colors.blue}📦 Starting backend server...${colors.reset}`,
);
console.log(
  `   ${colors.bright}→${colors.reset} API: http://localhost:8000`,
);
console.log(
  `   ${colors.bright}→${colors.reset} Endpoints: http://localhost:8000/api/health\n`,
);

const backend = backendProcess.spawn();

// Give backend a moment to start
await new Promise((resolve) => setTimeout(resolve, 1000));

console.log(
  `${colors.blue}🎨 Starting frontend server...${colors.reset}`,
);
console.log(
  `   ${colors.bright}→${colors.reset} App: http://localhost:3000\n`,
);

const frontend = frontendProcess.spawn();

console.log(
  `${colors.green}${colors.bright}✓ Development servers are starting!${colors.reset}`,
);
console.log(
  `${colors.yellow}Press Ctrl+C to stop${colors.reset}\n`,
);

// Handle graceful shutdown
const shutdown = async () => {
  console.log(
    `\n${colors.yellow}🛑 Shutting down servers...${colors.reset}`,
  );
  try {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    await Promise.race([
      Promise.all([backend.status, frontend.status]),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
    console.log(`${colors.green}✓ Servers stopped${colors.reset}`);
  } catch (error) {
    console.error(
      `${colors.red}Error during shutdown:${colors.reset}`,
      error,
    );
  }
  Deno.exit(0);
};

// Handle Ctrl+C
Deno.addSignalListener('SIGINT', shutdown);

// Monitor processes and handle crashes
Promise.race([backend.status, frontend.status]).then((status) => {
  console.error(
    `\n${colors.red}${colors.bright}✗ A server process exited unexpectedly${colors.reset}`,
  );
  console.error(`Exit status:`, status);
  shutdown();
}).catch((error) => {
  console.error(
    `\n${colors.red}${colors.bright}✗ Error:${colors.reset}`,
    error,
  );
  shutdown();
});
