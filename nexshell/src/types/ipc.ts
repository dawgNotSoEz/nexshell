export type PermissionLevel = 'admin' | 'standard' | 'guest';

export interface HostInfo {
  hostname: string;
  cwd: string;
  permissionLevel: PermissionLevel;
}

export interface ExecuteCommandPayload {
  input: string;
}

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface WindowStatePayload {
  isMaximized: boolean;
}
