"use strict";
/**
 * cd command handler - Change working directory
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCd = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const path_validator_1 = require("../../security/path-validator");
const handleCd = async (args, context) => {
    if (args.length === 0) {
        return { stdout: '', stderr: 'cd: path required', exitCode: 1 };
    }
    let target;
    try {
        target = (0, path_validator_1.resolveSafePath)(args[0], context.workingDirectory);
    }
    catch (error) {
        return { stdout: '', stderr: `cd: ${String(error)}`, exitCode: 1 };
    }
    try {
        const stats = await node_fs_1.default.promises.stat(target);
        if (!stats.isDirectory()) {
            return { stdout: '', stderr: `cd: not a directory: ${target}`, exitCode: 1 };
        }
        // Return new working directory (caller will update it)
        return { stdout: target, stderr: '', exitCode: 0 };
    }
    catch (error) {
        return { stdout: '', stderr: `cd: ${String(error)}`, exitCode: 1 };
    }
};
exports.handleCd = handleCd;
