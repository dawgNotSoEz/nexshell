/**
 * File operation commands: grep, unique, sort
 */

import fs from 'node:fs';
import readline from 'node:readline';
import type { CommandHandler, ExecutionContext } from '../types';
import { resolveSafePath } from '../../security/path-validator';

async function streamFileLines(
  filePath: string,
  context: ExecutionContext,
  onLine: (line: string) => void
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      context.signal?.removeEventListener('abort', abortHandler);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const abortHandler = () => {
      reader.close();
      stream.destroy();
      finish(new Error('Operation aborted'));
    };

    if (context.signal) {
      if (context.signal.aborted) {
        abortHandler();
        return;
      }
      context.signal.addEventListener('abort', abortHandler, { once: true });
    }

    reader.on('line', (line) => {
      onLine(line);
    });

    reader.once('close', () => finish());
    stream.once('error', (error) => finish(error));
  });
}

export const handleGrep: CommandHandler = async (args, context) => {
  const pattern = args[0];
  if (!pattern) {
    return { stdout: '', stderr: 'grep: pattern required', exitCode: 1 };
  }

  try {
    const regex = new RegExp(pattern, 'i');
    const matches: string[] = [];

    // Support stdin from pipe
    if (context.stdin) {
      const lines = context.stdin.split('\n');
      for (const line of lines) {
        if (regex.test(line)) {
          matches.push(line);
        }
      }
      return { stdout: matches.length ? matches.join('\n') : '(no matches)', stderr: '', exitCode: 0 };
    }

    // Read from file
    const fileTarget = args[1];
    if (!fileTarget) {
      return { stdout: '', stderr: 'grep: file required or stdin expected', exitCode: 1 };
    }

    const filePath = resolveSafePath(fileTarget, context.workingDirectory);
    await streamFileLines(filePath, context, (line) => {
      if (regex.test(line)) {
        matches.push(line);
      }
    });

    return { stdout: matches.length ? matches.join('\n') : '(no matches)', stderr: '', exitCode: 0 };
  } catch (error) {
    return { stdout: '', stderr: `grep: ${String(error)}`, exitCode: 1 };
  }
};

export const handleUnique: CommandHandler = async (args, context) => {
  // Support stdin from pipe
  if (context.stdin) {
    const lines = context.stdin.split('\n');
    const seen = new Set<string>();
    const uniqueLines: string[] = [];

    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        uniqueLines.push(line);
      }
    }

    return { stdout: uniqueLines.join('\n'), stderr: '', exitCode: 0 };
  }

  // Read from file
  const target = args[0];
  if (!target) {
    return { stdout: '', stderr: 'unique: file required or stdin expected', exitCode: 1 };
  }

  try {
    const filePath = resolveSafePath(target, context.workingDirectory);
    const seen = new Set<string>();
    const uniqueLines: string[] = [];

    await streamFileLines(filePath, context, (line) => {
      if (!seen.has(line)) {
        seen.add(line);
        uniqueLines.push(line);
      }
    });

    return { stdout: uniqueLines.join('\n'), stderr: '', exitCode: 0 };
  } catch (error) {
    return { stdout: '', stderr: `unique: ${String(error)}`, exitCode: 1 };
  }
};

export const handleSort: CommandHandler = async (args, context) => {
  // Support stdin from pipe
  if (context.stdin) {
    const lines = context.stdin.split('\n').filter(line => line.length > 0);
    const sorted = lines.sort((a, b) => a.localeCompare(b)).join('\n');
    return { stdout: sorted, stderr: '', exitCode: 0 };
  }

  // Read from file
  const target = args[0];
  if (!target) {
    return { stdout: '', stderr: 'sort: file required or stdin expected', exitCode: 1 };
  }

  try {
    const filePath = resolveSafePath(target, context.workingDirectory);
    const lines: string[] = [];

    await streamFileLines(filePath, context, (line) => {
      if (line.length > 0) {
        lines.push(line);
      }
    });

    const sorted = lines.sort((a, b) => a.localeCompare(b)).join('\n');
    return { stdout: sorted, stderr: '', exitCode: 0 };
  } catch (error) {
    return { stdout: '', stderr: `sort: ${String(error)}`, exitCode: 1 };
  }
};

