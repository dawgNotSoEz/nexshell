"use strict";
/**
 * IPC payload validation utilities
 * Ensures all IPC messages conform to expected structure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExecuteCommandPayload = validateExecuteCommandPayload;
exports.validateNonEmptyString = validateNonEmptyString;
/**
 * Validates an ExecuteCommandPayload structure
 * @param payload - The payload to validate
 * @returns True if valid, throws if invalid
 * @throws Error if payload structure is invalid
 */
function validateExecuteCommandPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload: must be an object');
    }
    const p = payload;
    if (!('input' in p)) {
        throw new Error('Invalid payload: missing "input" field');
    }
    if (typeof p.input !== 'string') {
        throw new Error('Invalid payload: "input" must be a string');
    }
    // Limit input size to prevent DoS
    if (p.input.length > 10000) {
        throw new Error('Invalid payload: "input" exceeds maximum length');
    }
    return true;
}
/**
 * Validates that a value is a non-empty string
 * @param value - The value to validate
 * @param fieldName - The field name for error messages
 * @returns The validated string
 * @throws Error if validation fails
 */
function validateNonEmptyString(value, fieldName) {
    if (typeof value !== 'string') {
        throw new Error(`Invalid ${fieldName}: must be a string`);
    }
    if (value.trim().length === 0) {
        throw new Error(`Invalid ${fieldName}: cannot be empty`);
    }
    return value;
}
