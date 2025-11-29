export type CommandCategory = 'core' | 'admin';

export interface ShellCommand {
  name: string;
  description: string;
  category: CommandCategory;
}

export type CommandGridVariant = '3x3' | '4x3';
