/**
 * Frontend sanitization utilities
 * Prevents XSS and ensures safe rendering
 * 
 * Note: React's textContent rendering automatically escapes HTML,
 * but we provide explicit sanitization for defense in depth.
 */

/**
 * Escapes HTML special characters for safe text rendering
 * @param text - The text to escape
 * @returns Escaped text safe for rendering
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitizes command output for terminal display
 * Preserves formatting while preventing XSS
 * React will automatically escape this when rendered as text,
 * but we sanitize here for defense in depth
 * @param output - The output string to sanitize
 * @returns Sanitized string safe for rendering
 */
export function sanitizeTerminalOutput(output: string): string {
  // Escape HTML special characters
  // React's text rendering will handle this, but we sanitize for safety
  return escapeHtml(output);
}

