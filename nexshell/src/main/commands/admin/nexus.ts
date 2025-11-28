/**
 * nexus command handler - Admin-only privileged operations
 * 
 * Provides actual working logic for system operations
 */

import os from 'node:os';
import type { CommandHandler, ExecutionContext } from '../types';
import type { CommandExecutionResult } from '../../../types/ipc';

interface NexusSubcommand {
  name: string;
  handler: (args: string[], context: ExecutionContext) => Promise<CommandExecutionResult>;
  description: string;
}

/**
 * nexus status - Show system status and information
 */
async function handleStatus(args: string[], context: ExecutionContext): Promise<CommandExecutionResult> {
  const uptime = Math.floor(os.uptime());
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  const info = [
    `System: ${os.type()} ${os.release()}`,
    `Hostname: ${os.hostname()}`,
    `Architecture: ${os.arch()}`,
    `Platform: ${os.platform()}`,
    `Uptime: ${hours}h ${minutes}m ${seconds}s`,
    `CPU Cores: ${os.cpus().length}`,
    `Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    `Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    `Working Directory: ${context.workingDirectory}`,
    `Permission Level: ${context.permissionLevel}`
  ];

  return {
    stdout: info.join('\n'),
    stderr: '',
    exitCode: 0
  };
}

/**
 * nexus system - Detailed system information
 */
async function handleSystem(args: string[], context: ExecutionContext): Promise<CommandExecutionResult> {
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

  const info = [
    '=== System Information ===',
    `OS: ${os.type()} ${os.release()}`,
    `Architecture: ${os.arch()}`,
    `CPU: ${cpuModel}`,
    `CPU Cores: ${cpus.length}`,
    `Total Memory: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
    `Used Memory: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB (${memUsagePercent}%)`,
    `Free Memory: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
    `Home Directory: ${os.homedir()}`,
    `Temp Directory: ${os.tmpdir()}`,
    `Node Version: ${process.version}`,
    `Platform: ${os.platform()}`
  ];

  return {
    stdout: info.join('\n'),
    stderr: '',
    exitCode: 0
  };
}

// Subcommand registry
const NEXUS_SUBCOMMANDS: Record<string, NexusSubcommand> = {
  status: {
    name: 'status',
    handler: handleStatus,
    description: 'Show system status and information'
  },
  system: {
    name: 'system',
    handler: handleSystem,
    description: 'Display detailed system information'
  }
};

/**
 * Main nexus command handler
 */
export const handleNexus: CommandHandler = async (args, context) => {
  if (context.permissionLevel !== 'admin') {
    return {
      stdout: '',
      stderr: 'nexus: admin permission required to execute nexus operations.',
      exitCode: 1
    };
  }

  if (args.length === 0) {
    const subcommands = Object.values(NEXUS_SUBCOMMANDS);
    const helpText = [
      'Nexus Admin Commands:',
      '='.repeat(50),
      ...subcommands.map(cmd => `  nexus ${cmd.name.padEnd(12)} ${cmd.description}`),
      '',
      'Usage: nexus <subcommand> [args...]'
    ].join('\n');

    return {
      stdout: helpText,
      stderr: '',
      exitCode: 0
    };
  }

  const subcommand = args[0].toLowerCase();
  const subcommandHandler = NEXUS_SUBCOMMANDS[subcommand];

  if (!subcommandHandler) {
    return {
      stdout: '',
      stderr: `nexus: unknown subcommand '${subcommand}'. Use 'nexus' to see available commands.`,
      exitCode: 1
    };
  }

  return subcommandHandler.handler(args.slice(1), context);
};
