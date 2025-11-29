"use strict";
/**
 * ls command handler - List directory contents
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLs = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const path_validator_1 = require("../../security/path-validator");
const handleLs = async (args, context) => {
    const flag = args.find((token) => token.startsWith('-')) ?? '';
    const pathArg = args.find((token) => !token.startsWith('-'));
    let targetDir;
    try {
        targetDir = (0, path_validator_1.resolveSafePath)(pathArg, context.workingDirectory);
    }
    catch (error) {
        return { stdout: '', stderr: `ls: ${String(error)}`, exitCode: 1 };
    }
    try {
        if (context.signal?.aborted) {
            throw new Error('Operation aborted');
        }
        const entries = await node_fs_1.default.promises.readdir(targetDir, { withFileTypes: true });
        const detailed = flag.includes('l');
        const outputLines = await Promise.all(entries.map(async (entry) => {
            if (context.signal?.aborted) {
                throw new Error('Operation aborted');
            }
            const entryPath = node_path_1.default.join(targetDir, entry.name);
            if (!detailed) {
                return entry.isDirectory() ? `${entry.name}/` : entry.name;
            }
            const stats = await node_fs_1.default.promises.stat(entryPath);
            const size = stats.size.toString().padStart(8, ' ');
            const type = entry.isDirectory() ? 'dir ' : 'file';
            return `${type} ${size} ${entry.name}`;
        }));
        return { stdout: outputLines.join('\n'), stderr: '', exitCode: 0 };
    }
    catch (error) {
        return { stdout: '', stderr: `ls: ${String(error)}`, exitCode: 1 };
    }
};
exports.handleLs = handleLs;
