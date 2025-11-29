"use strict";
/**
 * Command registry - Central registry for all available commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMAND_REGISTRY = void 0;
exports.getCommand = getCommand;
exports.hasCommand = hasCommand;
const cd_1 = require("./core/cd");
const cat_1 = require("./core/cat");
const fetch_1 = require("./core/fetch");
const file_ops_1 = require("./core/file-ops");
const help_1 = require("./core/help");
const ls_1 = require("./core/ls");
const pwd_1 = require("./core/pwd");
const nexus_1 = require("./admin/nexus");
const jobs_1 = require("./jobs");
/**
 * Registry of all available commands
 */
exports.COMMAND_REGISTRY = {
    help: {
        name: 'help',
        description: 'Show command reference',
        handler: help_1.handleHelp
    },
    ls: {
        name: 'ls',
        description: 'List directory contents',
        handler: ls_1.handleLs
    },
    pwd: {
        name: 'pwd',
        description: 'Print working directory',
        handler: pwd_1.handlePwd
    },
    cd: {
        name: 'cd',
        description: 'Change working directory',
        handler: cd_1.handleCd
    },
    cat: {
        name: 'cat',
        description: 'Concatenate and display file contents',
        handler: cat_1.handleCat,
        supportsStdin: true
    },
    fetch: {
        name: 'fetch',
        description: 'Fetch remote resource or read local file',
        handler: fetch_1.handleFetch
    },
    grep: {
        name: 'grep',
        description: 'Search file for pattern matches',
        handler: file_ops_1.handleGrep,
        supportsStdin: true
    },
    unique: {
        name: 'unique',
        description: 'Print unique lines from file',
        handler: file_ops_1.handleUnique,
        supportsStdin: true
    },
    sort: {
        name: 'sort',
        description: 'Sort file lines lexicographically',
        handler: file_ops_1.handleSort,
        supportsStdin: true
    },
    nexus: {
        name: 'nexus',
        description: 'Admin-only privileged operations',
        handler: nexus_1.handleNexus,
        requiresAdmin: true
    },
    jobs: {
        name: 'jobs',
        description: 'List tracked background jobs',
        handler: jobs_1.handleJobs
    },
    killjobs: {
        name: 'killjobs',
        description: 'Terminate a background job',
        handler: jobs_1.handleKillJobs
    }
};
/**
 * Get a command handler by name
 */
function getCommand(name) {
    return exports.COMMAND_REGISTRY[name.toLowerCase()];
}
/**
 * Check if a command exists
 */
function hasCommand(name) {
    return name.toLowerCase() in exports.COMMAND_REGISTRY;
}
