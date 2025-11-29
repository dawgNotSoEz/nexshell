"use strict";
/**
 * nexus command handler - Admin-only privileged operations
 *
 * Provides actual working logic for system operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNexus = void 0;
const node_os_1 = __importDefault(require("node:os"));
/**
 * nexus status - Show system status and information
 */
async function handleStatus(args, context) {
    const uptime = Math.floor(node_os_1.default.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    const info = [
        `System: ${node_os_1.default.type()} ${node_os_1.default.release()}`,
        `Hostname: ${node_os_1.default.hostname()}`,
        `Architecture: ${node_os_1.default.arch()}`,
        `Platform: ${node_os_1.default.platform()}`,
        `Uptime: ${hours}h ${minutes}m ${seconds}s`,
        `CPU Cores: ${node_os_1.default.cpus().length}`,
        `Total Memory: ${(node_os_1.default.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        `Free Memory: ${(node_os_1.default.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        `Working Directory: ${context.workingDirectory}`,
        `Permission Level: ${context.permissionLevel}`
    ];
    return {
        stdout: info.join('\n'),
        stderr: '',
        exitCode: 0
    };
}
/**
 * nexus system - Detailed system information
 */
async function handleSystem(args, context) {
    const cpus = node_os_1.default.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
    const totalMem = node_os_1.default.totalmem();
    const freeMem = node_os_1.default.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    const info = [
        '=== System Information ===',
        `OS: ${node_os_1.default.type()} ${node_os_1.default.release()}`,
        `Architecture: ${node_os_1.default.arch()}`,
        `CPU: ${cpuModel}`,
        `CPU Cores: ${cpus.length}`,
        `Total Memory: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        `Used Memory: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB (${memUsagePercent}%)`,
        `Free Memory: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        `Home Directory: ${node_os_1.default.homedir()}`,
        `Temp Directory: ${node_os_1.default.tmpdir()}`,
        `Node Version: ${process.version}`,
        `Platform: ${node_os_1.default.platform()}`
    ];
    return {
        stdout: info.join('\n'),
        stderr: '',
        exitCode: 0
    };
}
/**
 * nexus network - Network interface information
 */
async function handleNetwork(args, context) {
    const interfaces = node_os_1.default.networkInterfaces();
    const lines = ['=== Network Interfaces ==='];
    for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs)
            continue;
        lines.push(`\n${name}:`);
        for (const addr of addrs) {
            if (addr.family === 'IPv4') {
                lines.push(`  IPv4: ${addr.address} (${addr.internal ? 'internal' : 'external'})`);
            }
            else if (addr.family === 'IPv6') {
                lines.push(`  IPv6: ${addr.address} (${addr.internal ? 'internal' : 'external'})`);
            }
        }
    }
    return {
        stdout: lines.join('\n'),
        stderr: '',
        exitCode: 0
    };
}
/**
 * nexus users - User information
 */
async function handleUsers(args, context) {
    const userInfo = node_os_1.default.userInfo();
    const info = [
        '=== User Information ===',
        `Username: ${userInfo.username}`,
        `UID: ${userInfo.uid ?? 'N/A'}`,
        `GID: ${userInfo.gid ?? 'N/A'}`,
        `Home: ${userInfo.homedir}`,
        `Shell: ${userInfo.shell ?? 'N/A'}`
    ];
    return {
        stdout: info.join('\n'),
        stderr: '',
        exitCode: 0
    };
}
/**
 * nexus env - Environment variables
 */
async function handleEnv(args, context) {
    const env = process.env;
    const filter = args[0]?.toLowerCase();
    let output;
    if (filter) {
        // Filter environment variables
        output = Object.entries(env)
            .filter(([key]) => key.toLowerCase().includes(filter))
            .map(([key, value]) => `${key}=${value}`)
            .sort();
    }
    else {
        // Show all (limited to safe/common ones)
        const safeKeys = ['PATH', 'HOME', 'USER', 'SHELL', 'TEMP', 'TMP', 'NODE_ENV', 'PWD'];
        output = safeKeys
            .filter(key => env[key])
            .map(key => `${key}=${env[key]}`)
            .sort();
    }
    if (output.length === 0) {
        return {
            stdout: '',
            stderr: 'nexus env: No matching environment variables found',
            exitCode: 1
        };
    }
    return {
        stdout: output.join('\n'),
        stderr: '',
        exitCode: 0
    };
}
/**
 * nexus clear - Clear terminal (returns instruction)
 */
async function handleClear(args, context) {
    // In a real terminal, this would clear, but we return a message
    return {
        stdout: 'Terminal cleared (use Ctrl+L or refresh to clear UI)',
        stderr: '',
        exitCode: 0
    };
}
/**
 * nexus version - Show NexShell version
 */
async function handleVersion(args, context) {
    const info = [
        'NexShell v0.1.0',
        `Node.js: ${process.version}`,
        `Platform: ${node_os_1.default.platform()} ${node_os_1.default.arch()}`,
        `Electron: ${process.versions.electron ?? 'N/A'}`,
        'Built by Savitender Singh'
    ];
    return {
        stdout: info.join('\n'),
        stderr: '',
        exitCode: 0
    };
}
/**
 * nexus config - Show configuration
 */
async function handleConfig(args, context) {
    const config = [
        '=== NexShell Configuration ===',
        `Working Directory: ${context.workingDirectory}`,
        `Permission Level: ${context.permissionLevel}`,
        `Max File Read: 50 KB`,
        `Max Fetch Size: 50 KB`,
        `Max Pipeline Stages: 50`,
        `Security: Enabled`,
        `Path Traversal Protection: Enabled`,
        `IPC Validation: Enabled`
    ];
    return {
        stdout: config.join('\n'),
        stderr: '',
        exitCode: 0
    };
}
// Subcommand registry
const NEXUS_SUBCOMMANDS = {
    status: {
        name: 'status',
        handler: handleStatus,
        description: 'Show system status and information'
    },
    system: {
        name: 'system',
        handler: handleSystem,
        description: 'Display detailed system information'
    },
    network: {
        name: 'network',
        handler: handleNetwork,
        description: 'Show network interface information'
    },
    users: {
        name: 'users',
        handler: handleUsers,
        description: 'Display user information'
    },
    env: {
        name: 'env',
        handler: handleEnv,
        description: 'Show environment variables (optionally filtered)'
    },
    clear: {
        name: 'clear',
        handler: handleClear,
        description: 'Clear terminal output'
    },
    version: {
        name: 'version',
        handler: handleVersion,
        description: 'Show NexShell version information'
    },
    config: {
        name: 'config',
        handler: handleConfig,
        description: 'Display NexShell configuration'
    }
};
/**
 * Main nexus command handler
 */
const handleNexus = async (args, context) => {
    if (context.permissionLevel !== 'admin') {
        return {
            stdout: '',
            stderr: 'nexus: admin permission required to execute nexus operations.',
            exitCode: 1
        };
    }
    if (args.length === 0) {
        // Show available subcommands
        const subcommands = Object.values(NEXUS_SUBCOMMANDS);
        const helpText = [
            'Nexus Admin Commands:',
            '='.repeat(50),
            ...subcommands.map(cmd => `  nexus ${cmd.name.padEnd(12)} ${cmd.description}`),
            '',
            'Usage: nexus <subcommand> [args...]',
            'Example: nexus status, nexus system, nexus network'
        ].join('\n');
        return {
            stdout: helpText,
            stderr: '',
            exitCode: 0
        };
    }
    const subcommand = args[0].toLowerCase();
    const subcommandHandler = NEXUS_SUBCOMMANDS[subcommand];
    if (!subcommandHandler) {
        return {
            stdout: '',
            stderr: `nexus: unknown subcommand '${subcommand}'. Use 'nexus' to see available commands.`,
            exitCode: 1
        };
    }
    // Execute the subcommand with remaining args
    return subcommandHandler.handler(args.slice(1), context);
};
exports.handleNexus = handleNexus;
