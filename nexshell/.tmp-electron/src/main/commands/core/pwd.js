"use strict";
/**
 * pwd command handler - Print working directory
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePwd = void 0;
const handlePwd = async (_args, context) => {
    return { stdout: context.workingDirectory, stderr: '', exitCode: 0 };
};
exports.handlePwd = handlePwd;
