/**
 * Command highlighting utilities
 * 
 * Highlights pipes, redirections, and special symbols in command input
 */

import type { ColoredSegment } from './colorize';
import { CommandColors } from '../theme/tokens';

export interface HighlightedSegment extends ColoredSegment {
  type?: 'command' | 'argument' | 'pipe' | 'redirect-in' | 'redirect-out' | 'background' | 'whitespace';
}

/**
 * Converts HighlightedSegment to ColoredSegment for compatibility
 */
export function toColoredSegment(segment: HighlightedSegment): ColoredSegment {
  return {
    text: segment.text,
    displayText: segment.displayText,
    colorVar: segment.colorVar
  };
}

const PIPE_COLOR = 'var(--color-pipe)';
const REDIRECT_COLOR = 'var(--color-connector-neon)';
const BACKGROUND_COLOR = 'var(--color-perm-violet)';

/**
 * Highlights shell syntax in command input
 * @param input - The command input string
 * @returns Array of highlighted segments
 */
export function highlightCommandSyntax(input: string): HighlightedSegment[] {
  if (!input) {
    return [];
  }

  const segments: HighlightedSegment[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let i = 0;

  while (i < input.length) {
    const char = input[i];
    const nextChar = i + 1 < input.length ? input[i + 1] : '';

    // Handle quotes
    if ((char === '"' || char === "'") && !inQuote) {
      if (current) {
        segments.push(createSegment(current, 'argument'));
        current = '';
      }
      inQuote = true;
      quoteChar = char;
      i++;
      continue;
    }

    if (char === quoteChar && inQuote) {
      if (current) {
        segments.push(createSegment(current, 'argument'));
        current = '';
      }
      inQuote = false;
      quoteChar = '';
      i++;
      continue;
    }

    // Inside quotes, add character as-is
    if (inQuote) {
      current += char;
      i++;
      continue;
    }

    // Handle whitespace
    if (/\s/.test(char)) {
      if (current) {
        // Determine segment type
        const type = determineSegmentType(current, segments);
        segments.push(createSegment(current, type));
        current = '';
      }
      segments.push(createSegment(char, 'whitespace'));
      i++;
      continue;
    }

    // Handle pipes
    if (char === '|') {
      if (current) {
        const type = determineSegmentType(current, segments);
        segments.push(createSegment(current, type));
        current = '';
      }
      segments.push(createSegment('|', 'pipe'));
      i++;
      continue;
    }

    // Handle redirection
    if (char === '<') {
      if (current) {
        const type = determineSegmentType(current, segments);
        segments.push(createSegment(current, type));
        current = '';
      }
      segments.push(createSegment('<', 'redirect-in'));
      i++;
      continue;
    }

    if (char === '>') {
      if (current) {
        const type = determineSegmentType(current, segments);
        segments.push(createSegment(current, type));
        current = '';
      }
      segments.push(createSegment('>', 'redirect-out'));
      i++;
      continue;
    }

    // Handle background job
    if (char === '&' && /\s/.test(nextChar) || i === input.length - 1) {
      if (current) {
        const type = determineSegmentType(current, segments);
        segments.push(createSegment(current, type));
        current = '';
      }
      segments.push(createSegment('&', 'background'));
      i++;
      continue;
    }

    // Regular character
    current += char;
    i++;
  }

  // Add remaining token
  if (current) {
    const type = determineSegmentType(current, segments);
    segments.push(createSegment(current, type));
  }

  return segments;
}

/**
 * Determines the type of a segment based on context
 */
function determineSegmentType(text: string, previousSegments: HighlightedSegment[]): 'command' | 'argument' {
  // First non-whitespace segment is usually the command
  const nonWhitespace = previousSegments.filter(s => s.type !== 'whitespace');
  if (nonWhitespace.length === 0) {
    // Check if it's 'nexus' for special coloring
    if (text.toLowerCase() === 'nexus') {
      return 'command';
    }
    return 'command';
  }

  // After pipes/redirections, next token is usually a command
  const lastSegment = nonWhitespace[nonWhitespace.length - 1];
  if (lastSegment.type === 'pipe' || lastSegment.type === 'redirect-in' || lastSegment.type === 'redirect-out') {
    return 'command';
  }

  return 'argument';
}

/**
 * Creates a highlighted segment
 */
function createSegment(text: string, type: HighlightedSegment['type']): HighlightedSegment {
  const displayText = text.replace(/ /g, '\u00A0');
  
  let colorVar: string;
  switch (type) {
    case 'pipe':
      colorVar = PIPE_COLOR;
      break;
    case 'redirect-in':
    case 'redirect-out':
      colorVar = REDIRECT_COLOR;
      break;
    case 'background':
      colorVar = BACKGROUND_COLOR;
      break;
    case 'command':
      // Check if it's nexus for special coloring
      if (text.toLowerCase() === 'nexus') {
        colorVar = CommandColors.nexus;
      } else {
        colorVar = CommandColors.normal;
      }
      break;
    case 'argument':
      colorVar = CommandColors.normal;
      break;
    case 'whitespace':
      colorVar = CommandColors.normal;
      break;
    default:
      colorVar = CommandColors.normal;
  }

  return {
    text,
    displayText,
    colorVar,
    type
  };
}

