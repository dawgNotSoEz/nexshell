/**
 * cd command handler - Change working directory
 */

import fs from 'node:fs';
import type { CommandHandler } from '../types';
import { resolveSafePath } from '../../security/path-validator';

export const handleCd: CommandHandler = async (args, context) => {
  if (args.length === 0) {
    return { stdout: '', stderr: 'cd: path required', exitCode: 1 };
  }

  let target: string;
  try {
    target = resolveSafePath(args[0], context.workingDirectory);
  } catch (error) {
    return { stdout: '', stderr: `cd: ${String(error)}`, exitCode: 1 };
  }

  try {
    const stats = await fs.promises.stat(target);
    if (!stats.isDirectory()) {
      return { stdout: '', stderr: `cd: not a directory: ${target}`, exitCode: 1 };
    }
    
    // Return new working directory (caller will update it)
    return { stdout: target, stderr: '', exitCode: 0 };
  } catch (error) {
    return { stdout: '', stderr: `cd: ${String(error)}`, exitCode: 1 };
  }
};



