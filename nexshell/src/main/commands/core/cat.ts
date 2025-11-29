/**
 * cat command handler - Concatenate and display file contents
 */

import fs from 'node:fs';
import type { CommandHandler } from '../types';
import { resolveSafePath } from '../../security/path-validator';

const MAX_FILE_READ_BYTES = 50 * 1024; // 50 KB limit

export const handleCat: CommandHandler = async (args, context) => {
  // If no args and stdin is provided, read from stdin
  if (args.length === 0 && context.stdin) {
    return {
      stdout: context.stdin,
      stderr: '',
      exitCode: 0
    };
  }

  // If no args and no stdin, show usage
  if (args.length === 0) {
    return {
      stdout: '',
      stderr: 'cat: file required or stdin expected',
      exitCode: 1
    };
  }

  // Read all specified files
  const outputs: string[] = [];
  
  for (const fileArg of args) {
    try {
      if (context.signal?.aborted) {
        throw new Error('Operation aborted');
      }

      const filePath = resolveSafePath(fileArg, context.workingDirectory);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isDirectory()) {
        outputs.push(`cat: ${fileArg}: Is a directory`);
        continue;
      }

      if (stats.size > MAX_FILE_READ_BYTES) {
        outputs.push(`cat: ${fileArg}: File larger than ${MAX_FILE_READ_BYTES} bytes not allowed`);
        continue;
      }

      const content = await fs.promises.readFile(filePath, 'utf8');
      outputs.push(content);
    } catch (error) {
      outputs.push(`cat: ${fileArg}: ${String(error)}`);
    }
  }

  // Check if any errors occurred
  const errors = outputs.filter(line => line.startsWith('cat:'));
  const hasErrors = errors.length > 0;

  return {
    stdout: hasErrors ? '' : outputs.join(''),
    stderr: hasErrors ? errors.join('\n') : '',
    exitCode: hasErrors ? 1 : 0
  };
};



