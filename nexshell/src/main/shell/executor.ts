/**
 * NexShell Command Executor
 * 
 * Executes parsed commands with support for:
 * - Pipelines (|)
 * - Redirection (<, >)
 * - Background jobs
 */

import fs from 'node:fs';
import type { CommandExecutionResult, PermissionLevel } from '../../types/ipc';
import type { ExecutionContext } from '../commands/types';
import { getCommand } from '../commands/registry';
import { resolveSafePath } from '../security/path-validator';
import type { ParsedCommand, CommandStage } from './parser';

const MAX_PIPELINE_STAGES = 50; // Prevent infinite pipes
const MAX_FILE_WRITE_BYTES = 100 * 1024; // 100 KB max write

/**
 * Executes a single command stage
 */
async function executeStage(
  stage: CommandStage,
  stdin: string | null,
  context: ExecutionContext
): Promise<CommandExecutionResult> {
  const command = getCommand(stage.cmd.toLowerCase());
  
  if (!command) {
    return {
      stdout: '',
      stderr: `Command not found: ${stage.cmd}`,
      exitCode: 127
    };
  }

  // Check admin requirement
  if (command.requiresAdmin && context.permissionLevel !== 'admin') {
    return {
      stdout: '',
      stderr: `${stage.cmd}: admin permission required`,
      exitCode: 1
    };
  }

  // Handle input redirection
  let inputData: string | undefined = stdin || undefined;
  if (stage.input === 'redirect' && stage.inputFile) {
    try {
      const inputPath = resolveSafePath(stage.inputFile, context.workingDirectory);
      const stats = await fs.promises.stat(inputPath);
      
      if (stats.size > 50 * 1024) {
        return {
          stdout: '',
          stderr: `Input file too large: ${stage.inputFile}`,
          exitCode: 1
        };
      }

      inputData = await fs.promises.readFile(inputPath, 'utf8');
    } catch (error) {
      return {
        stdout: '',
        stderr: `Cannot read input file ${stage.inputFile}: ${String(error)}`,
        exitCode: 1
      };
    }
  }

  // Prepare execution context
  const execContext: ExecutionContext = {
    ...context,
    stdin: inputData
  };

  // Execute command
  let result: CommandExecutionResult;
  
  // Special handling for cd
  if (stage.cmd.toLowerCase() === 'cd') {
    result = await command.handler(stage.args, execContext);
    // Update working directory if successful
    if (result.exitCode === 0 && result.stdout) {
      context.workingDirectory = result.stdout;
    }
  } else {
    result = await command.handler(stage.args, execContext);
  }

  // Handle output redirection
  if (stage.output === 'redirect' && stage.outputFile) {
    try {
      const outputPath = resolveSafePath(stage.outputFile, context.workingDirectory);
      
      // Check if output is too large
      if (result.stdout.length > MAX_FILE_WRITE_BYTES) {
        return {
          stdout: '',
          stderr: `Output too large to write to ${stage.outputFile}`,
          exitCode: 1
        };
      }

      await fs.promises.writeFile(outputPath, result.stdout, 'utf8');
      // Return success message instead of output
      return {
        stdout: `Output written to ${stage.outputFile}`,
        stderr: result.stderr,
        exitCode: result.exitCode
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: `Cannot write output file ${stage.outputFile}: ${String(error)}`,
        exitCode: 1
      };
    }
  }

  return result;
}

/**
 * Executes a parsed command (single or pipeline)
 */
export async function executeParsedCommand(
  parsed: ParsedCommand,
  context: ExecutionContext
): Promise<CommandExecutionResult> {
  if (parsed.stages.length === 0) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  // Prevent pipeline DoS
  if (parsed.stages.length > MAX_PIPELINE_STAGES) {
    return {
      stdout: '',
      stderr: `Pipeline too long: maximum ${MAX_PIPELINE_STAGES} stages allowed`,
      exitCode: 1
    };
  }

  // Execute pipeline
  let stdin: string | null = null;
  let lastResult: CommandExecutionResult = { stdout: '', stderr: '', exitCode: 0 };
  let combinedStderr = '';

  for (let i = 0; i < parsed.stages.length; i++) {
    const stage = parsed.stages[i];
    
    // Set input source
    if (i > 0) {
      // Previous stage's stdout becomes this stage's stdin
      stdin = lastResult.stdout;
    } else if (stage.input === 'redirect' && stage.inputFile) {
      // First stage with input redirection
      stdin = null; // Will be handled in executeStage
    }

    // Execute stage
    lastResult = await executeStage(stage, stdin, context);
    
    // Collect stderr from all stages
    if (lastResult.stderr) {
      combinedStderr += (combinedStderr ? '\n' : '') + lastResult.stderr;
    }

    // If a stage fails, stop pipeline (unless it's the last stage)
    if (lastResult.exitCode !== 0 && i < parsed.stages.length - 1) {
      return {
        stdout: '',
        stderr: combinedStderr || `Pipeline failed at stage ${i + 1}: ${stage.cmd}`,
        exitCode: lastResult.exitCode
      };
    }

    // Update stdin for next stage
    stdin = lastResult.stdout;
  }

  // Return final result with combined stderr
  return {
    stdout: lastResult.stdout,
    stderr: combinedStderr || lastResult.stderr,
    exitCode: lastResult.exitCode
  };
}



