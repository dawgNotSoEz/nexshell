"use strict";
/**
 * fetch command handler - Fetch remote resources or read local files
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFetch = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_http_1 = __importDefault(require("node:http"));
const node_https_1 = __importDefault(require("node:https"));
const path_validator_1 = require("../../security/path-validator");
const MAX_FILE_READ_BYTES = 50 * 1024; // 50 KB as per requirements
const FETCH_BODY_LIMIT = 50 * 1024; // 50 KB as per requirements
async function fetchRemoteResource(target, context) {
    if (context.signal?.aborted) {
        throw new Error('Operation aborted');
    }
    const url = (0, path_validator_1.validateFetchUrl)(target);
    const client = url.protocol === 'https:' ? node_https_1.default : node_http_1.default;
    return new Promise((resolve, reject) => {
        const request = client.get(url, (response) => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                if (body.length + chunk.length <= FETCH_BODY_LIMIT) {
                    body += chunk;
                }
                else {
                    request.destroy();
                    reject(new Error(`Response body exceeds ${FETCH_BODY_LIMIT} bytes limit`));
                }
            });
            response.on('end', () => {
                const headers = Object.entries(response.headers)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
                cleanup();
                resolve(`Status: ${response.statusCode}\n${headers}\n---\n${body}`);
            });
        });
        const abortHandler = () => {
            request.destroy(new Error('Operation aborted'));
            cleanup();
            reject(new Error('Operation aborted'));
        };
        const cleanup = () => {
            context.signal?.removeEventListener('abort', abortHandler);
        };
        if (context.signal) {
            if (context.signal.aborted) {
                abortHandler();
                return;
            }
            context.signal.addEventListener('abort', abortHandler, { once: true });
        }
        request.on('error', (error) => {
            cleanup();
            reject(error);
        });
    });
}
async function fetchLocalResource(target, context) {
    if (context.signal?.aborted) {
        throw new Error('Operation aborted');
    }
    const resolved = (0, path_validator_1.resolveSafePath)(target, context.workingDirectory);
    const stats = await node_fs_1.default.promises.stat(resolved);
    if (stats.size > MAX_FILE_READ_BYTES) {
        throw new Error(`fetch: file larger than ${MAX_FILE_READ_BYTES} bytes not allowed`);
    }
    if (context.signal?.aborted) {
        throw new Error('Operation aborted');
    }
    const data = await node_fs_1.default.promises.readFile(resolved, 'utf8');
    return data;
}
const handleFetch = async (args, context) => {
    const target = args[0];
    if (!target) {
        return { stdout: '', stderr: 'fetch: target required', exitCode: 1 };
    }
    try {
        const isUrl = /^https?:/i.test(target);
        const payload = isUrl
            ? await fetchRemoteResource(target, context)
            : await fetchLocalResource(target, context);
        return { stdout: payload, stderr: '', exitCode: 0 };
    }
    catch (error) {
        return { stdout: '', stderr: `fetch: ${String(error)}`, exitCode: 1 };
    }
};
exports.handleFetch = handleFetch;
