"use strict";
/**
 * NexShell Backend - Main command execution and IPC handler
 *
 * This module coordinates command execution, manages working directory state,
 * handles background jobs, and registers IPC handlers for secure communication
 * with the renderer process.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHostInfo = getHostInfo;
exports.executeWhitelistedCommand = executeWhitelistedCommand;
exports.registerBackendHandlers = registerBackendHandlers;
const electron_1 = require("electron");
const node_os_1 = __importDefault(require("node:os"));
const jobs_1 = require("./commands/jobs");
const ipc_validator_1 = require("./security/ipc-validator");
const parser_1 = require("./shell/parser");
const executor_1 = require("./shell/executor");
// Working directory state (starts at process cwd)
let workingDirectory = process.cwd();
/**
 * Detects the current permission level based on OS and user context
 * @returns The detected permission level
 */
function detectPermissionLevel() {
    if (process.platform !== 'win32') {
        if (typeof process.getuid === 'function' && process.getuid() === 0) {
            return 'admin';
        }
        return 'standard';
    }
    const username = node_os_1.default.userInfo().username.toLowerCase();
    if (username === 'administrator' || username.endsWith('\\administrator')) {
        return 'admin';
    }
    return 'standard';
}
/**
 * Gets current host information (hostname, cwd, permission level)
 * @returns HostInfo object with current system state
 */
function getHostInfo() {
    return {
        hostname: node_os_1.default.hostname(),
        cwd: workingDirectory,
        permissionLevel: detectPermissionLevel()
    };
}
/**
 * Executes a command using the shell parser and executor
 * @param input - Raw command input string
 * @param context - Execution context with permission level and working directory
 * @returns Command execution result
 */
async function executeInternalCommand(input, context) {
    // Parse the command
    const parsed = (0, parser_1.parseCommand)(input);
    if (parsed.stages.length === 0) {
        return { stdout: '', stderr: '', exitCode: 0 };
    }
    // Create execution context
    const execContext = {
        permissionLevel: context.permissionLevel,
        signal: context.signal,
        workingDirectory: context.workingDirectory
    };
    // Execute using the shell executor
    return (0, executor_1.executeParsedCommand)(parsed, execContext);
}
/**
 * Creates a background job that executes asynchronously
 * @param commandLine - Command to execute in background
 * @param baseContext - Base execution context
 * @returns The created job record
 */
function createBackgroundJob(commandLine, baseContext) {
    const controller = new AbortController();
    const job = jobs_1.jobManager.create(commandLine);
    // Execute command asynchronously
    (async () => {
        try {
            const result = await executeInternalCommand(commandLine, {
                ...baseContext,
                signal: controller.signal,
                workingDirectory: baseContext.workingDirectory
            });
            if (job.status === 'killed') {
                return;
            }
            job.status = 'completed';
            job.stdout = result.stdout;
            job.stderr = result.stderr;
            job.exitCode = result.exitCode;
            job.endedAt = Date.now();
            jobs_1.jobManager.update(job);
        }
        catch (error) {
            if (job.status === 'killed') {
                return;
            }
            job.status = 'failed';
            job.stderr = String(error);
            job.exitCode = 1;
            job.endedAt = Date.now();
            jobs_1.jobManager.update(job);
        }
    })();
    return job;
}
/**
 * Executes a whitelisted command (main entry point for command execution)
 * Handles both foreground and background execution
 * @param rawInput - Raw command input from user
 * @returns Command execution result
 */
async function executeWhitelistedCommand(rawInput) {
    const trimmedInput = rawInput.trim();
    if (!trimmedInput) {
        return { stdout: '', stderr: '', exitCode: 0 };
    }
    // Parse command to check for background execution
    const parsed = (0, parser_1.parseCommand)(trimmedInput);
    if (parsed.stages.length === 0) {
        return { stdout: '', stderr: '', exitCode: 0 };
    }
    const context = {
        permissionLevel: detectPermissionLevel(),
        workingDirectory
    };
    // Handle background jobs
    if (parsed.background) {
        // Remove & from original input for job storage
        const commandLine = parsed.originalInput.replace(/&\s*$/, '').trim();
        const job = createBackgroundJob(commandLine, context);
        return { stdout: `Started job #${job.id}: ${job.command}`, stderr: '', exitCode: 0 };
    }
    // Execute foreground command
    return executeInternalCommand(trimmedInput, { ...context, workingDirectory });
}
/**
 * Registers IPC handlers for secure communication with renderer
 * All handlers validate payloads and use namespaced channels
 */
function registerBackendHandlers() {
    // Get host information (hostname, cwd, permission level)
    electron_1.ipcMain.handle('nexshell:getHostInfo', async () => {
        return getHostInfo();
    });
    // Execute command with validation
    electron_1.ipcMain.handle('nexshell:executeCommand', async (_event, payload) => {
        try {
            // Validate payload structure
            (0, ipc_validator_1.validateExecuteCommandPayload)(payload);
            const validatedPayload = payload;
            // Execute the command
            return await executeWhitelistedCommand(validatedPayload.input);
        }
        catch (error) {
            // Return error result for invalid payloads
            return {
                stdout: '',
                stderr: `IPC error: ${error instanceof Error ? error.message : String(error)}`,
                exitCode: 1
            };
        }
    });
}
// Register handlers on module load
registerBackendHandlers();
