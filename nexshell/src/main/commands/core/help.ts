/**
 * help command handler - Display command reference
 */

import type { CommandHandler } from '../types';
import { COMMAND_REGISTRY } from '../registry';

export const handleHelp: CommandHandler = async () => {
  const commands = Object.values(COMMAND_REGISTRY);
  
  // Separate core and admin commands
  const coreCommands = commands.filter(cmd => !cmd.requiresAdmin);
  const adminCommands = commands.filter(cmd => cmd.requiresAdmin);

  let output = 'NexShell Command Reference\n';
  output += '='.repeat(60) + '\n\n';
  
  output += 'Core Commands:\n';
  output += '-'.repeat(60) + '\n';
  coreCommands.forEach(cmd => {
    const name = cmd.name.padEnd(18, ' ');
    output += `  ${name} ${cmd.description}\n`;
  });

  if (adminCommands.length > 0) {
    output += '\nAdmin Commands (nexus prefix required):\n';
    output += '-'.repeat(60) + '\n';
    adminCommands.forEach(cmd => {
      const name = `nexus ${cmd.name}`.padEnd(18, ' ');
      output += `  ${name} ${cmd.description}\n`;
    });
  }

  output += '\n' + '='.repeat(60) + '\n';
  output += 'Use pipes (|) to chain commands: cat file.txt | grep pattern\n';
  output += 'Use redirection: ls > output.txt, cat < input.txt\n';
  output += 'Background jobs: command &\n';

  return {
    stdout: output,
    stderr: '',
    exitCode: 0
  };
};
