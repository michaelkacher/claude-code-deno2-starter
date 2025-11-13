/**
 * Cross-Platform Script Runner
 * Executes shell scripts with cross-platform compatibility (Windows/Unix)
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";
import { extname, resolve } from "https://deno.land/std@0.208.0/path/mod.ts";

export interface ScriptRunOptions {
  /** Script file path to execute */
  scriptPath: string;
  /** Arguments to pass to the script */
  args?: string[];
  /** Working directory for script execution */
  cwd?: string;
  /** Environment variables to set */
  env?: Record<string, string>;
  /** Whether to capture output or stream to console */
  capture?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface ScriptRunResult {
  success: boolean;
  code: number;
  stdout: string;
  stderr: string;
  duration: number;
}

/**
 * Detects the current operating system
 */
export function detectOS(): "windows" | "unix" {
  return Deno.build.os === "windows" ? "windows" : "unix";
}

/**
 * Determines the appropriate shell command for the script
 */
export function getShellCommand(scriptPath: string): string[] {
  const os = detectOS();
  const ext = extname(scriptPath).toLowerCase();

  if (os === "windows") {
    switch (ext) {
      case ".ps1":
        return ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File"];
      case ".bat":
      case ".cmd":
        return ["cmd.exe", "/c"];
      case ".sh":
        // Try to use Git Bash or WSL bash on Windows
        return ["bash"];
      default:
        return ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File"];
    }
  } else {
    switch (ext) {
      case ".sh":
        return ["bash"];
      case ".ps1":
        // Try to use PowerShell Core on Unix if available
        return ["pwsh"];
      default:
        return ["bash"];
    }
  }
}

/**
 * Runs a script with cross-platform compatibility
 */
export async function runScript(
  options: ScriptRunOptions
): Promise<ScriptRunResult> {
  const startTime = Date.now();
  const scriptPath = resolve(options.scriptPath);

  // Check if script exists
  if (!(await exists(scriptPath))) {
    return {
      success: false,
      code: 1,
      stdout: "",
      stderr: `Script not found: ${scriptPath}`,
      duration: Date.now() - startTime,
    };
  }

  // Build command
  const shellCmd = getShellCommand(scriptPath);
  const cmd = [...shellCmd, scriptPath, ...(options.args || [])];

  // Prepare environment
  const env = { ...Deno.env.toObject(), ...(options.env || {}) };

  try {
    // Create command with proper options
    const command = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      cwd: options.cwd,
      env,
      stdout: options.capture ? "piped" : "inherit",
      stderr: options.capture ? "piped" : "inherit",
    });

    // Handle timeout if specified
    let timeoutId: number | undefined;
    const processPromise = command.output();
    const timeoutPromise = options.timeout
      ? new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Script timeout after ${options.timeout}ms`));
          }, options.timeout);
        })
      : null;

    const output = timeoutPromise
      ? await Promise.race([processPromise, timeoutPromise])
      : await processPromise;

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    const duration = Date.now() - startTime;
    const stdout = options.capture
      ? new TextDecoder().decode(output.stdout)
      : "";
    const stderr = options.capture
      ? new TextDecoder().decode(output.stderr)
      : "";

    return {
      success: output.success,
      code: output.code,
      stdout,
      stderr,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      code: 1,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

/**
 * Finds the appropriate script version for the current OS
 * @param baseName - Base name without extension (e.g., "detect-related-features")
 * @param scriptDir - Directory containing scripts
 */
export async function findScriptForOS(
  baseName: string,
  scriptDir: string = "./scripts"
): Promise<string | null> {
  const os = detectOS();
  const extensions = os === "windows" ? [".ps1", ".bat", ".cmd", ".sh"] : [".sh", ".ps1"];

  for (const ext of extensions) {
    const scriptPath = resolve(scriptDir, baseName + ext);
    if (await exists(scriptPath)) {
      return scriptPath;
    }
  }

  return null;
}

/**
 * Runs a script by base name, automatically selecting the right version for OS
 */
export async function runScriptByName(
  baseName: string,
  args: string[] = [],
  options: Omit<ScriptRunOptions, "scriptPath" | "args"> = {}
): Promise<ScriptRunResult> {
  const scriptPath = await findScriptForOS(
    baseName,
    options.cwd || "./scripts"
  );

  if (!scriptPath) {
    return {
      success: false,
      code: 1,
      stdout: "",
      stderr: `No compatible script found for: ${baseName}`,
      duration: 0,
    };
  }

  return runScript({
    ...options,
    scriptPath,
    args,
  });
}

// CLI interface
if (import.meta.main) {
  const args = parse(Deno.args, {
    string: ["script", "cwd", "timeout"],
    boolean: ["capture", "help", "version"],
    alias: {
      s: "script",
      c: "cwd",
      t: "timeout",
      h: "help",
      v: "version",
    },
  });

  if (args.help) {
    console.log(`
Cross-Platform Script Runner

Usage:
  deno run --allow-read --allow-run --allow-env scripts/run-cross-platform.ts [options] [script-args...]

Options:
  -s, --script <path>     Script to run (required)
  -c, --cwd <path>        Working directory
  -t, --timeout <ms>      Timeout in milliseconds
  --capture               Capture output instead of streaming
  -h, --help              Show this help
  -v, --version           Show version

Examples:
  # Run a script with default settings
  deno run --allow-read --allow-run --allow-env scripts/run-cross-platform.ts -s scripts/detect-related-features.sh "my-feature"

  # Run with timeout and custom working directory
  deno run --allow-read --allow-run --allow-env scripts/run-cross-platform.ts -s scripts/test.sh --timeout 30000 --cwd ./tests

  # Run by base name (auto-detects .sh or .ps1)
  deno run --allow-read --allow-run --allow-env scripts/run-cross-platform.ts -s detect-related-features "my-feature"
`);
    Deno.exit(0);
  }

  if (args.version) {
    console.log("Cross-Platform Script Runner v1.0.0");
    Deno.exit(0);
  }

  if (!args.script) {
    console.error("❌ Error: --script is required");
    console.error("Run with --help for usage information");
    Deno.exit(1);
  }

  const scriptArgs = args._.map(String);
  const scriptPath = args.script;

  console.log(`🚀 Running script: ${scriptPath}`);
  console.log(`📍 OS detected: ${detectOS()}`);
  console.log(`🔧 Shell command: ${getShellCommand(scriptPath).join(" ")}`);

  let result: ScriptRunResult;

  // Check if it's a base name or full path
  if (extname(scriptPath)) {
    // Full path provided
    result = await runScript({
      scriptPath,
      args: scriptArgs,
      cwd: args.cwd,
      capture: args.capture,
      timeout: args.timeout ? parseInt(args.timeout) : undefined,
    });
  } else {
    // Base name provided, find appropriate version
    result = await runScriptByName(scriptPath, scriptArgs, {
      cwd: args.cwd,
      capture: args.capture,
      timeout: args.timeout ? parseInt(args.timeout) : undefined,
    });
  }

  if (args.capture) {
    if (result.stdout) {
      console.log("\n📤 STDOUT:");
      console.log(result.stdout);
    }
    if (result.stderr) {
      console.error("\n📤 STDERR:");
      console.error(result.stderr);
    }
  }

  console.log(`\n⏱️  Duration: ${result.duration}ms`);
  console.log(`📊 Exit code: ${result.code}`);

  if (result.success) {
    console.log("✅ Script completed successfully");
  } else {
    console.error("❌ Script failed");
  }

  Deno.exit(result.code);
}
