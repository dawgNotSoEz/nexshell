/**
 * Path validation and sanitization utilities
 * Prevents directory traversal attacks and ensures safe file operations
 */

import path from 'node:path';

/**
 * Validates and resolves a target path, preventing directory traversal
 * @param target - The target path (can be relative or absolute)
 * @param baseDir - The base directory to resolve relative paths against
 * @returns Resolved absolute path if valid, throws if traversal detected
 * @throws Error if path traversal is detected
 */
export function resolveSafePath(target: string | undefined, baseDir: string): string {
  if (!target) {
    return baseDir;
  }

  // Resolve to absolute path
  const resolved = path.isAbsolute(target) ? path.normalize(target) : path.resolve(baseDir, target);
  const normalized = path.normalize(resolved);

  // Prevent directory traversal by checking for .. segments
  // After normalization, .. should be resolved, but we check the input and result
  const inputParts = target.split(path.sep);
  const resolvedParts = normalized.split(path.sep);
  
  // Check if input contains .. (attempted traversal)
  if (inputParts.includes('..')) {
    throw new Error('Path traversal detected: cannot use .. in paths');
  }

  // Additional safety: ensure resolved path doesn't contain .. (shouldn't happen after normalize, but double-check)
  if (resolvedParts.includes('..')) {
    throw new Error('Path traversal detected: resolved path contains ..');
  }

  // On Windows, also check for UNC paths and other edge cases
  if (process.platform === 'win32') {
    // Prevent accessing drives other than the base directory's drive
    const baseDrive = baseDir.split(path.sep)[0];
    const resolvedDrive = normalized.split(path.sep)[0];
    if (baseDrive && resolvedDrive && baseDrive !== resolvedDrive && baseDrive.length === 2 && resolvedDrive.length === 2) {
      throw new Error('Path traversal detected: cannot access different drive');
    }
  }

  return normalized;
}

/**
 * Validates that a URL is safe for fetching (only HTTP/HTTPS)
 * @param urlString - The URL string to validate
 * @returns The URL object if valid
 * @throws Error if protocol is not http: or https:
 */
export function validateFetchUrl(urlString: string): URL {
  try {
    const url = new URL(urlString);
    const protocol = url.protocol.toLowerCase();
    
    if (protocol !== 'http:' && protocol !== 'https:') {
      throw new Error(`Unsafe protocol: ${protocol}. Only http: and https: are allowed`);
    }
    
    return url;
  } catch (error) {
    if (error instanceof TypeError) {
      // Not a valid URL, might be a file path
      throw new Error('Invalid URL format');
    }
    throw error;
  }
}

/**
 * Sanitizes a string to prevent XSS in terminal output
 * @param input - The string to sanitize
 * @returns Sanitized string safe for HTML rendering
 */
export function sanitizeOutput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

