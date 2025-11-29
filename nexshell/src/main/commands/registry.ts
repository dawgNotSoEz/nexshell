/**
 * Command registry - Central registry for all available commands
 */

import type { CommandDefinition, CommandHandler } from './types';
import { handleCd } from './core/cd';
import { handleCat } from './core/cat';
import { handleFetch } from './core/fetch';
import { handleGrep, handleSort, handleUnique } from './core/file-ops';
import { handleHelp } from './core/help';
import { handleLs } from './core/ls';
import { handlePwd } from './core/pwd';
import { handleNexus } from './admin/nexus';
import { handleJobs, handleKillJobs } from './jobs';

/**
 * Registry of all available commands
 */
export const COMMAND_REGISTRY: Record<string, CommandDefinition> = {
  help: {
    name: 'help',
    description: 'Show command reference',
    handler: handleHelp
  },
  ls: {
    name: 'ls',
    description: 'List directory contents',
    handler: handleLs
  },
  pwd: {
    name: 'pwd',
    description: 'Print working directory',
    handler: handlePwd
  },
  cd: {
    name: 'cd',
    description: 'Change working directory',
    handler: handleCd
  },
  cat: {
    name: 'cat',
    description: 'Concatenate and display file contents',
    handler: handleCat,
    supportsStdin: true
  },
  fetch: {
    name: 'fetch',
    description: 'Fetch remote resource or read local file',
    handler: handleFetch
  },
  grep: {
    name: 'grep',
    description: 'Search file for pattern matches',
    handler: handleGrep,
    supportsStdin: true
  },
  unique: {
    name: 'unique',
    description: 'Print unique lines from file',
    handler: handleUnique,
    supportsStdin: true
  },
  sort: {
    name: 'sort',
    description: 'Sort file lines lexicographically',
    handler: handleSort,
    supportsStdin: true
  },
  nexus: {
    name: 'nexus',
    description: 'Admin-only privileged operations',
    handler: handleNexus,
    requiresAdmin: true
  },
  jobs: {
    name: 'jobs',
    description: 'List tracked background jobs',
    handler: handleJobs
  },
  killjobs: {
    name: 'killjobs',
    description: 'Terminate a background job',
    handler: handleKillJobs
  }
};

/**
 * Get a command handler by name
 */
export function getCommand(name: string): CommandDefinition | undefined {
  return COMMAND_REGISTRY[name.toLowerCase()];
}

/**
 * Check if a command exists
 */
export function hasCommand(name: string): boolean {
  return name.toLowerCase() in COMMAND_REGISTRY;
}

