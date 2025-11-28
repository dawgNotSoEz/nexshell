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

/**
 * nexus network - Network interface information
 */
async function handleNetwork(args: string[], context: ExecutionContext): Promise<CommandExecutionResult> {
  const interfaces = os.networkInterfaces();
  const lines: string[] = ['=== Network Interfaces ==='];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    lines.push(`\n${name}:`);
    for (const addr of addrs) {
      if (addr.family === 'IPv4') {
        lines.push(`  IPv4: ${addr.address} (${addr.internal ? 'internal' : 'external'})`);
      } else if (addr.family === 'IPv6') {
        lines.push(`  IPv6: ${addr.address} (${addr.internal ? 'internal' : 'external'})`);
      }
    }
  }

  return {
    stdout: lines.join('\n'),
    stderr: '',
    exitCode: 0
  };
}

/**
 * nexus users - User information
 */
async function handleUsers(args: string[], context: ExecutionContext): Promise<CommandExecutionResult> {
  const userInfo = os.userInfo();
  const info = [
    '=== User Information ===',
    `Username: ${userInfo.username}`,
    `UID: ${userInfo.uid ?? 'N/A'}`,
    `GID: ${userInfo.gid ?? 'N/A'}`,
    `Home: ${userInfo.homedir}`,
    `Shell: ${userInfo.shell ?? 'N/A'}`
  ];

  return {
    stdout: info.join('\n'),
    stderr: '',
    exitCode: 0
  };
}

/**
 * nexus env - Environment variables
 */
async function handleEnv(args: string[], context: ExecutionContext): Promise<CommandExecutionResult> {
  const env = process.env;
  const filter = args[0]?.toLowerCase();

  let output: string[];
  if (filter) {
    // Filter environment variables
    output = Object.entries(env)
      .filter(([key]) => key.toLowerCase().includes(filter))
      .map(([key, value]) => `${key}=${value}`)
      .sort();
  } else {
    // Show all (limited to safe/common ones)
    const safeKeys = ['PATH', 'HOME', 'USER', 'SHELL', 'TEMP', 'TMP', 'NODE_ENV', 'PWD'];
    output = safeKeys
      .filter(key => env[key])
      .map(key => `${key}=${env[key]}`)
      .sort();
  }

  if (output.length === 0) {
    return {
      stdout: '',
      stderr: 'nexus env: No matching environment variables found',
      exitCode: 1
    };
  }

  return {
    stdout: output.join('\n'),
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
  },
  network: {
    name: 'network',
    handler: handleNetwork,
    description: 'Show network interface information'
  },
  users: {
    name: 'users',
    handler: handleUsers,
    description: 'Display user information'
  },
  env: {
    name: 'env',
    handler: handleEnv,
    description: 'Show environment variables (optionally filtered)'
  },
  clear: {
    name: 'clear',
    handler: handleClear,
    description: 'Clear terminal output'
  },
  version: {
    name: 'version',
    handler: handleVersion,
    description: 'Show NexShell version information'
  },
  config: {
    name: 'config',
    handler: handleConfig,
    description: 'Display NexShell configuration'
  }
};

/**
 * nexus clear - Clear terminal (returns instruction)
 */
async function handleClear(args: string[], context: ExecutionContext): Promise<CommandExecutionResult> {
  // In a real terminal, this would clear, but we return a message
  return {
    stdout: 'Terminal cleared (use Ctrl+L or refresh to clear UI)',
    stderr: '',
    exitCode: 0
  };
}

/**
 * nexus version - Show NexShell version
 */
async function handleVersion(args: string[], context: ExecutionContext): Promise<CommandExecutionResult> {
  const info = [
    'NexShell v0.1.0',
    `Node.js: ${process.version}`,
    `Platform: ${os.platform()} ${os.arch()}`,
    `Electron: ${process.versions.electron ?? 'N/A'}`,
    'Built by Savitender Singh'
  ];

  return {
    stdout: info.join('\n'),
    stderr: '',
    exitCode: 0
  };
}

/**
 * nexus config - Show configuration
 */
async function handleConfig(args: string[], context: ExecutionContext): Promise<CommandExecutionResult> {
  const config = [
    '=== NexShell Configuration ===',
    `Working Directory: ${context.workingDirectory}`,
    `Permission Level: ${context.permissionLevel}`,
    `Max File Read: 50 KB`,
    `Max Fetch Size: 50 KB`,
    `Max Pipeline Stages: 50`,
    `Security: Enabled`,
    `Path Traversal Protection: Enabled`,
    `IPC Validation: Enabled`
  ];

  return {
    stdout: config.join('\n'),
    stderr: '',
    exitCode: 0
  };
}

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
