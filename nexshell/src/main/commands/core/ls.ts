/**
 * ls command handler - List directory contents
 */

import fs from 'node:fs';
import path from 'node:path';
import type { CommandHandler } from '../types';
import { resolveSafePath } from '../../security/path-validator';

export const handleLs: CommandHandler = async (args, context) => {
  const flag = args.find((token) => token.startsWith('-')) ?? '';
  const pathArg = args.find((token) => !token.startsWith('-'));
  
  let targetDir: string;
  try {
    targetDir = resolveSafePath(pathArg, context.workingDirectory);
  } catch (error) {
    return { stdout: '', stderr: `ls: ${String(error)}`, exitCode: 1 };
  }

  try {
    if (context.signal?.aborted) {
      throw new Error('Operation aborted');
    }

    const entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
    const detailed = flag.includes('l');
    
    const outputLines = await Promise.all(
      entries.map(async (entry) => {
        if (context.signal?.aborted) {
          throw new Error('Operation aborted');
        }

        const entryPath = path.join(targetDir, entry.name);
        if (!detailed) {
          return entry.isDirectory() ? `${entry.name}/` : entry.name;
        }

        const stats = await fs.promises.stat(entryPath);
        const size = stats.size.toString().padStart(8, ' ');
        const type = entry.isDirectory() ? 'dir ' : 'file';
        return `${type} ${size} ${entry.name}`;
      })
    );

    return { stdout: outputLines.join('\n'), stderr: '', exitCode: 0 };
  } catch (error) {
    return { stdout: '', stderr: `ls: ${String(error)}`, exitCode: 1 };
  }
};



