#!/usr/bin/env -S deno run --allow-run

/**
 * Kill Ports Script
 *
 * Kills processes running on the application ports (3000).
 * Useful when ports are blocked by hidden instances of the app.
 *
 * Usage:
 *   deno task kill-ports
 */

const PORTS = [3000]; // Fresh port
const isWindows = Deno.build.os === "windows";

async function findProcessOnPort(port: number): Promise<string | null> {
  try {
    if (isWindows) {
      // Windows: netstat -ano | findstr :<port>
      const cmd = new Deno.Command("cmd", {
        args: ["/c", `netstat -ano | findstr :${port}`],
        stdout: "piped",
        stderr: "piped",
      });
      const { stdout } = await cmd.output();
      const output = new TextDecoder().decode(stdout);

      // Parse PID from netstat output (last column)
      // Example: TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
      const lines = output.split("\n").filter((line) => line.includes("LISTENING"));
      if (lines.length === 0) return null;

      const match = lines[0].match(/\s+(\d+)\s*$/);
      return match ? match[1] : null;
    } else {
      // Unix-like: lsof -ti :<port>
      const cmd = new Deno.Command("lsof", {
        args: ["-ti", `:${port}`],
        stdout: "piped",
        stderr: "piped",
      });
      const { stdout } = await cmd.output();
      const output = new TextDecoder().decode(stdout).trim();
      return output || null;
    }
  } catch {
    return null;
  }
}

async function killProcess(pid: string): Promise<boolean> {
  try {
    if (isWindows) {
      // Windows: taskkill /F /PID <pid>
      const cmd = new Deno.Command("taskkill", {
        args: ["/F", "/PID", pid],
        stdout: "piped",
        stderr: "piped",
      });
      const { success } = await cmd.output();
      return success;
    } else {
      // Unix-like: kill -9 <pid>
      const cmd = new Deno.Command("kill", {
        args: ["-9", pid],
        stdout: "piped",
        stderr: "piped",
      });
      const { success } = await cmd.output();
      return success;
    }
  } catch {
    return false;
  }
}

async function main() {
  console.log("🔍 Checking for processes on ports:", PORTS.join(", "));
  console.log("");

  let killedAny = false;

  for (const port of PORTS) {
    const pid = await findProcessOnPort(port);

    if (pid) {
      console.log(`⚠️  Port ${port} is in use by PID ${pid}`);
      console.log(`   Attempting to kill process...`);

      const success = await killProcess(pid);
      if (success) {
        console.log(`✅ Successfully killed process on port ${port}`);
        killedAny = true;
      } else {
        console.log(`❌ Failed to kill process on port ${port}`);
        console.log(`   Try running with administrator/sudo privileges`);
      }
    } else {
      console.log(`✅ Port ${port} is free`);
    }

    console.log("");
  }

  if (killedAny) {
    console.log("✨ Ports cleared! You can now run 'deno task dev'");
  } else if (PORTS.every(async (port) => await findProcessOnPort(port) === null)) {
    console.log("✨ All ports are already free!");
  }
}

if (import.meta.main) {
  main();
}
