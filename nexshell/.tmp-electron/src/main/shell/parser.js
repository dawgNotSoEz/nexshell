"use strict";
/**
 * NexShell Shell Parser
 *
 * Parses shell commands into an AST that supports:
 * - Pipes (|)
 * - Redirection (<, >)
 * - Background jobs (&)
 * - Quoted strings
 * - Tokenization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCommand = parseCommand;
exports.isNexusCommand = isNexusCommand;
/**
 * Tokenizes input string, handling quoted strings and special characters
 */
function tokenize(input) {
    const tokens = [];
    let current = '';
    let inDoubleQuote = false;
    let inSingleQuote = false;
    let i = 0;
    while (i < input.length) {
        const char = input[i];
        const nextChar = i + 1 < input.length ? input[i + 1] : '';
        // Handle quotes
        if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            i++;
            continue;
        }
        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
            i++;
            continue;
        }
        // Inside quotes, add character as-is
        if (inDoubleQuote || inSingleQuote) {
            current += char;
            i++;
            continue;
        }
        // Handle whitespace
        if (/\s/.test(char)) {
            if (current) {
                tokens.push(current);
                current = '';
            }
            i++;
            continue;
        }
        // Handle special operators (must be separate tokens)
        if (char === '|' || char === '<' || char === '>') {
            if (current) {
                tokens.push(current);
                current = '';
            }
            // Handle >> (append) and << (here-doc) if needed
            if ((char === '>' && nextChar === '>') || (char === '<' && nextChar === '<')) {
                tokens.push(char + nextChar);
                i += 2;
                continue;
            }
            tokens.push(char);
            i++;
            continue;
        }
        // Regular character
        current += char;
        i++;
    }
    // Add remaining token
    if (current) {
        tokens.push(current);
    }
    return tokens;
}
/**
 * Parses a shell command into an AST
 */
function parseCommand(input) {
    const trimmed = input.trim();
    if (!trimmed) {
        return {
            type: 'single',
            stages: [],
            background: false,
            originalInput: input
        };
    }
    // Check for background job
    const isBackground = trimmed.endsWith('&');
    const commandLine = isBackground ? trimmed.slice(0, -1).trim() : trimmed;
    // Tokenize
    const tokens = tokenize(commandLine);
    if (tokens.length === 0) {
        return {
            type: 'single',
            stages: [],
            background: isBackground,
            originalInput: input
        };
    }
    // Check for pipes
    const pipeIndices = [];
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === '|') {
            pipeIndices.push(i);
        }
    }
    // If no pipes, parse as single command
    if (pipeIndices.length === 0) {
        return parseSingleCommand(tokens, isBackground, input);
    }
    // Parse pipeline
    const stages = [];
    let startIndex = 0;
    for (const pipeIndex of pipeIndices) {
        const stageTokens = tokens.slice(startIndex, pipeIndex);
        const stage = parseCommandStage(stageTokens, startIndex === 0 ? null : 'pipe');
        stages.push(stage);
        startIndex = pipeIndex + 1;
    }
    // Parse last stage
    const lastStageTokens = tokens.slice(startIndex);
    const lastStage = parseCommandStage(lastStageTokens, startIndex === 0 ? null : 'pipe');
    stages.push(lastStage);
    return {
        type: 'pipeline',
        stages,
        background: isBackground,
        originalInput: input
    };
}
/**
 * Parses a single command stage (command with args and redirections)
 */
function parseCommandStage(tokens, inputSource) {
    const cmd = [];
    const args = [];
    let input = inputSource;
    let output = null;
    let inputFile;
    let outputFile;
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        const nextToken = i + 1 < tokens.length ? tokens[i + 1] : null;
        // Handle redirection
        if (token === '<') {
            if (nextToken) {
                input = 'redirect';
                inputFile = nextToken;
                i += 2; // Skip < and filename
                continue;
            }
        }
        if (token === '>') {
            if (nextToken) {
                output = 'redirect';
                outputFile = nextToken;
                i += 2; // Skip > and filename
                continue;
            }
        }
        // Regular token - command or argument
        if (cmd.length === 0) {
            cmd.push(token);
        }
        else {
            args.push(token);
        }
        i++;
    }
    return {
        cmd: cmd[0] || '',
        args,
        input,
        output,
        inputFile,
        outputFile
    };
}
/**
 * Parses a single command (no pipes)
 */
function parseSingleCommand(tokens, background, originalInput) {
    const stage = parseCommandStage(tokens, null);
    return {
        type: 'single',
        stages: [stage],
        background,
        originalInput
    };
}
/**
 * Detects if a command starts with 'nexus' (for special coloring)
 */
function isNexusCommand(parsed) {
    if (parsed.stages.length === 0) {
        return false;
    }
    return parsed.stages[0].cmd.toLowerCase() === 'nexus';
}
