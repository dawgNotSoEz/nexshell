/**
 * pwd command handler - Print working directory
 */

import type { CommandHandler } from '../types';

export const handlePwd: CommandHandler = async (_args, context) => {
  return { stdout: context.workingDirectory, stderr: '', exitCode: 0 };
};



