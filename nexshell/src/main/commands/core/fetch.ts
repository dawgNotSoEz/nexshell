/**
 * fetch command handler - Fetch remote resources or read local files
 */

import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import type { CommandHandler, ExecutionContext } from '../types';
import { resolveSafePath, validateFetchUrl } from '../../security/path-validator';

const MAX_FILE_READ_BYTES = 50 * 1024; // 50 KB as per requirements
const FETCH_BODY_LIMIT = 50 * 1024; // 50 KB as per requirements

async function fetchRemoteResource(target: string, context: ExecutionContext): Promise<string> {
  if (context.signal?.aborted) {
    throw new Error('Operation aborted');
  }

  const url = validateFetchUrl(target);
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      
      response.on('data', (chunk) => {
        if (body.length + chunk.length <= FETCH_BODY_LIMIT) {
          body += chunk;
        } else {
          request.destroy();
          reject(new Error(`Response body exceeds ${FETCH_BODY_LIMIT} bytes limit`));
        }
      });

      response.on('end', () => {
        const headers = Object.entries(response.headers)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        cleanup();
        resolve(`Status: ${response.statusCode}\n${headers}\n---\n${body}`);
      });
    });

    const abortHandler = () => {
      request.destroy(new Error('Operation aborted'));
      cleanup();
      reject(new Error('Operation aborted'));
    };

    const cleanup = () => {
      context.signal?.removeEventListener('abort', abortHandler);
    };

    if (context.signal) {
      if (context.signal.aborted) {
        abortHandler();
        return;
      }
      context.signal.addEventListener('abort', abortHandler, { once: true });
    }

    request.on('error', (error) => {
      cleanup();
      reject(error);
    });
  });
}

async function fetchLocalResource(target: string, context: ExecutionContext): Promise<string> {
  if (context.signal?.aborted) {
    throw new Error('Operation aborted');
  }

  const resolved = resolveSafePath(target, context.workingDirectory);
  const stats = await fs.promises.stat(resolved);
  
  if (stats.size > MAX_FILE_READ_BYTES) {
    throw new Error(`fetch: file larger than ${MAX_FILE_READ_BYTES} bytes not allowed`);
  }

  if (context.signal?.aborted) {
    throw new Error('Operation aborted');
  }

  const data = await fs.promises.readFile(resolved, 'utf8');
  return data;
}

export const handleFetch: CommandHandler = async (args, context) => {
  const target = args[0];
  if (!target) {
    return { stdout: '', stderr: 'fetch: target required', exitCode: 1 };
  }

  try {
    const isUrl = /^https?:/i.test(target);
    const payload = isUrl
      ? await fetchRemoteResource(target, context)
      : await fetchLocalResource(target, context);
    return { stdout: payload, stderr: '', exitCode: 0 };
  } catch (error) {
    return { stdout: '', stderr: `fetch: ${String(error)}`, exitCode: 1 };
  }
};

