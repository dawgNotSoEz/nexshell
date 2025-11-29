/**
 * NexShell Backend - Main command execution and IPC handler
 * 
 * This module coordinates command execution, manages working directory state,
 * handles background jobs, and registers IPC handlers for secure communication
 * with the renderer process.
 */

import { ipcMain } from 'electron';
import os from 'node:os';
import path from 'node:path';

import type { CommandExecutionResult, ExecuteCommandPayload, HostInfo, PermissionLevel } from '../types/ipc';
import type { ExecutionContext } from './commands/types';
import { jobManager, handleJobs, handleKillJobs, type JobRecord } from './commands/jobs';
import { validateExecuteCommandPayload } from './security/ipc-validator';
import { parseCommand } from './shell/parser';
import { executeParsedCommand } from './shell/executor';

// Working directory state (starts at process cwd)
let workingDirectory = process.cwd();

/**
 * Detects the current permission level based on OS and user context
 * @returns The detected permission level
 */
function detectPermissionLevel(): PermissionLevel {
  if (process.platform !== 'win32') {
    if (typeof process.getuid === 'function' && process.getuid() === 0) {
      return 'admin';
    }
    return 'standard';
  }

  const username = os.userInfo().username.toLowerCase();
  if (username === 'administrator' || username.endsWith('\\administrator')) {
    return 'admin';
  }
  return 'standard';
}

/**
 * Gets current host information (hostname, cwd, permission level)
 * @returns HostInfo object with current system state
 */
export function getHostInfo(): HostInfo {
  return {
    hostname: os.hostname(),
    cwd: workingDirectory,
    permissionLevel: detectPermissionLevel()
  };
}

/**
 * Executes a command using the shell parser and executor
 * @param input - Raw command input string
 * @param context - Execution context with permission level and working directory
 * @returns Command execution result
 */
async function executeInternalCommand(
  input: string,
  context: { permissionLevel: PermissionLevel; signal?: AbortSignal; workingDirectory: string }
): Promise<CommandExecutionResult> {
  // Parse the command
  const parsed = parseCommand(input);
  
  if (parsed.stages.length === 0) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  // Create execution context
  const execContext: ExecutionContext = {
    permissionLevel: context.permissionLevel,
    signal: context.signal,
    workingDirectory: context.workingDirectory
  };

  // Execute using the shell executor
  return executeParsedCommand(parsed, execContext);
}

/**
 * Creates a background job that executes asynchronously
 * @param commandLine - Command to execute in background
 * @param baseContext - Base execution context
 * @returns The created job record
 */
function createBackgroundJob(
  commandLine: string,
  baseContext: { permissionLevel: PermissionLevel; workingDirectory: string }
): JobRecord {
  const controller = new AbortController();
  const job = jobManager.create(commandLine);

  // Execute command asynchronously
  (async () => {
    try {
      const result = await executeInternalCommand(commandLine, {
        ...baseContext,
        signal: controller.signal,
        workingDirectory: baseContext.workingDirectory
      });

      if (job.status === 'killed') {
        return;
      }

      job.status = 'completed';
      job.stdout = result.stdout;
      job.stderr = result.stderr;
      job.exitCode = result.exitCode;
      job.endedAt = Date.now();
      jobManager.update(job);
    } catch (error) {
      if (job.status === 'killed') {
        return;
      }

      job.status = 'failed';
      job.stderr = String(error);
      job.exitCode = 1;
      job.endedAt = Date.now();
      jobManager.update(job);
    }
  })();

  return job;
}

/**
 * Executes a whitelisted command (main entry point for command execution)
 * Handles both foreground and background execution
 * @param rawInput - Raw command input from user
 * @returns Command execution result
 */
export async function executeWhitelistedCommand(rawInput: string): Promise<CommandExecutionResult> {
  const trimmedInput = rawInput.trim();
  if (!trimmedInput) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  // Parse command to check for background execution
  const parsed = parseCommand(trimmedInput);
  
  if (parsed.stages.length === 0) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  const context = {
    permissionLevel: detectPermissionLevel(),
    workingDirectory
  };

  // Handle background jobs
  if (parsed.background) {
    // Remove & from original input for job storage
    const commandLine = parsed.originalInput.replace(/&\s*$/, '').trim();
    const job = createBackgroundJob(commandLine, context);
    return { stdout: `Started job #${job.id}: ${job.command}`, stderr: '', exitCode: 0 };
  }

  // Execute foreground command
  return executeInternalCommand(trimmedInput, { ...context, workingDirectory });
}

/**
 * Registers IPC handlers for secure communication with renderer
 * All handlers validate payloads and use namespaced channels
 */
export function registerBackendHandlers(): void {
  // Get host information (hostname, cwd, permission level)
  ipcMain.handle('nexshell:getHostInfo', async (): Promise<HostInfo> => {
    return getHostInfo();
  });

  // Execute command with validation
  ipcMain.handle('nexshell:executeCommand', async (_event, payload: unknown): Promise<CommandExecutionResult> => {
    try {
      // Validate payload structure
      validateExecuteCommandPayload(payload);
      const validatedPayload = payload as ExecuteCommandPayload;
      
      // Execute the command
      return await executeWhitelistedCommand(validatedPayload.input);
    } catch (error) {
      // Return error result for invalid payloads
      return {
        stdout: '',
        stderr: `IPC error: ${error instanceof Error ? error.message : String(error)}`,
        exitCode: 1
      };
    }
  });
}

// Register handlers on module load
registerBackendHandlers();
