/**
 * Command input colorization utilities
 * 
 * Tokenizes and colors command input according to NexShell rules:
 * - Normal commands: yellow
 * - nexus prefix: neon red
 */

import { CommandColors } from '../theme/tokens';

export type ColoredSegment = {
	text: string;
	displayText: string;
	colorVar: string;
};

const whitespacePattern = /^\s+$/;

/**
 * Colorizes command input by tokenizing and applying color rules
 * @param input - The command input string
 * @returns Array of colored segments for rendering
 */
export function colorizeCommandInput(input: string): ColoredSegment[] {
	if (!input) {
		return [];
	}

	const segments = input.split(/(\s+)/);
	const firstTokenIndex = segments.findIndex((segment) => segment.trim().length > 0);
	const firstToken = firstTokenIndex >= 0 ? segments[firstTokenIndex].trim().toLowerCase() : '';

	return segments.map((segment, index) => {
		// Replace spaces with non-breaking spaces for display
		const displayText = segment.replace(/ /g, '\u00A0');
		
		// Whitespace uses default command color
		if (whitespacePattern.test(segment)) {
			return { text: segment, displayText, colorVar: CommandColors.normal };
		}

		// First token: check if it's 'nexus' for special coloring
		if (index === firstTokenIndex && firstToken === 'nexus') {
			return { text: segment, displayText, colorVar: CommandColors.nexus };
		}

		// Default: normal command color (yellow)
		return { text: segment, displayText, colorVar: CommandColors.normal };
	});
}
