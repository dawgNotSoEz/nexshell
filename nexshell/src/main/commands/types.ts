/**
 * Command execution types and interfaces
 */

import type { CommandExecutionResult, PermissionLevel } from '../../types/ipc';

export interface ExecutionContext {
  permissionLevel: PermissionLevel;
  signal?: AbortSignal;
  workingDirectory: string;
  stdin?: string; // Input from pipe or redirection
  stdoutRedirect?: string; // File path for output redirection
}

export interface CommandHandler {
  (args: string[], context: ExecutionContext): Promise<CommandExecutionResult>;
}

export interface CommandDefinition {
  name: string;
  description: string;
  handler: CommandHandler;
  requiresAdmin?: boolean;
  supportsStdin?: boolean; // Whether command can read from stdin
}

