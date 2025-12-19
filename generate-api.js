#!/usr/bin/env node
/**
 * @fileoverview OpenAPI TypeScript Generator for Angular
 * 
 * Fetches OpenAPI/Swagger documentation from a backend server and generates
 * TypeScript API client code for Angular applications.
 * 
 * Compatible with: Windows 11, Linux, macOS
 * 
 * @requires SWAGGER_DOCS_HOST - Environment variable with the API docs URL
 * @example
 *   SWAGGER_DOCS_HOST=http://localhost:8080/v3/api-docs node generate-api.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { fork } = require('child_process');
const fetch = require('node-fetch');
require('dotenv').config();

// ============================================================================
// Platform Detection & Color Support
// ============================================================================

const isWindows = os.platform() === 'win32';

/**
 * Detects if the terminal supports ANSI colors
 * @returns {boolean}
 */
function supportsColors() {
  // Force colors with environment variable
  if (process.env.FORCE_COLOR === '1') return true;
  if (process.env.NO_COLOR === '1') return false;
  
  // Windows Terminal, VS Code, and modern terminals support colors
  if (process.env.WT_SESSION) return true; // Windows Terminal
  if (process.env.TERM_PROGRAM === 'vscode') return true;
  if (process.env.COLORTERM) return true;
  
  // Check if stdout is a TTY
  if (!process.stdout.isTTY) return false;
  
  // Most modern terminals support colors
  const term = process.env.TERM || '';
  if (term === 'dumb') return false;
  
  return true;
}

const useColors = supportsColors();

// ============================================================================
// Configuration (using path.join for cross-platform compatibility)
// ============================================================================

const CONFIG = {
  outputDir: path.join('src', 'api'),
  generatorPath: path.join('node_modules', 'openapi-typescript-angular-generator', 'bin', 'ng-ts-codegen.js'),
  timeout: 30000, // 30 seconds
  cleanupFiles: [
    path.join('src', 'api', 'index.ts'),
    path.join('src', 'api', 'api', 'api.ts'),
    path.join('src', 'api', 'model', 'models.ts')
  ]
};

// ============================================================================
// Logging utilities with cross-platform color support
// ============================================================================

/**
 * Wraps text with ANSI color codes if supported
 * @param {string} text - Text to colorize
 * @param {string} colorCode - ANSI color code
 * @returns {string}
 */
function colorize(text, colorCode) {
  if (!useColors) return text;
  return `\x1b[${colorCode}m${text}\x1b[0m`;
}

// Icons with ASCII fallbacks for older Windows consoles
const icons = {
  info: useColors ? 'ℹ' : '[i]',
  success: useColors ? '✓' : '[OK]',
  warn: useColors ? '⚠' : '[!]',
  error: useColors ? '✗' : '[X]',
  tool: useColors ? '🔧' : '[*]'
};

const log = {
  info: (msg) => console.log(`${colorize(icons.info, '36')} ${msg}`),
  success: (msg) => console.log(`${colorize(icons.success, '32')} ${msg}`),
  warn: (msg) => console.warn(`${colorize(icons.warn, '33')} ${msg}`),
  error: (msg) => console.error(`${colorize(icons.error, '31')} ${msg}`),
  step: (num, msg) => console.log(`\n${colorize(`[${num}]`, '34')} ${msg}`)
};

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Validates and normalizes the Swagger docs URL
 * @param {string|undefined} url - Raw URL from environment
 * @returns {string} Normalized URL with protocol
 * @throws {Error} If URL is missing or invalid
 */
function validateAndNormalizeUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error(
      'Missing SWAGGER_DOCS_HOST environment variable.\n' +
      '   Create a .env file with:\n' +
      '   SWAGGER_DOCS_HOST=http://localhost:8080/v3/api-docs'
    );
  }

  let normalizedUrl = url.trim();

  // Add protocol if missing
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    log.warn(`URL missing protocol, prepending http://`);
    normalizedUrl = 'http://' + normalizedUrl;
  }

  // Basic URL validation
  try {
    new URL(normalizedUrl);
  } catch {
    throw new Error(`Invalid URL format: ${normalizedUrl}`);
  }

  return normalizedUrl;
}

/**
 * Ensures the output directory exists
 * @param {string} dirPath - Directory path to create
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log.info(`Created directory: ${dirPath}`);
  }
}

/**
 * Safely removes a file if it exists
 * @param {string} filePath - Path to file to remove
 * @returns {boolean} True if file was removed, false if it didn't exist
 */
function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false; // File doesn't exist, not an error
    }
    throw err;
  }
}

/**
 * Creates a timeout promise for fetch operations
 * Compatible with Node.js 14+ (no AbortController required)
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} Promise that rejects after timeout
 */
function createTimeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
  });
}

/**
 * Fetches and validates the OpenAPI specification
 * Uses Promise.race for timeout (compatible with Node.js 14+)
 * @param {string} url - URL to fetch from
 * @returns {Promise<object>} Parsed OpenAPI spec
 */
async function fetchOpenApiSpec(url) {
  // Use Promise.race for timeout - works in Node.js 14+ without AbortController
  const fetchPromise = fetch(url, {
    headers: { 'Accept': 'application/json' },
    timeout: CONFIG.timeout
  });

  const response = await Promise.race([
    fetchPromise,
    createTimeout(CONFIG.timeout + 1000)
  ]);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const spec = await response.json();

  // Basic OpenAPI validation
  if (!spec.openapi && !spec.swagger) {
    throw new Error('Response is not a valid OpenAPI/Swagger specification');
  }

  return spec;
}

/**
 * Runs the TypeScript code generator
 * @param {string} inputUrl - OpenAPI spec URL
 * @param {string} outputDir - Output directory
 * @returns {Promise<number>} Exit code
 */
function runGenerator(inputUrl, outputDir) {
  return new Promise((resolve, reject) => {
    const generatorPath = path.resolve(CONFIG.generatorPath);

    if (!fs.existsSync(generatorPath)) {
      reject(new Error(
        `Generator not found at: ${generatorPath}\n` +
        '   Run: npm install openapi-typescript-angular-generator'
      ));
      return;
    }

    const proc = fork(generatorPath, ['-i', inputUrl, '-o', outputDir], {
      stdio: 'inherit'
    });

    proc.on('error', reject);
    proc.on('exit', (code) => resolve(code ?? 1));
  });
}

/**
 * Cleans up generated files that are not needed
 */
function cleanupGeneratedFiles() {
  let removedCount = 0;

  for (const filePath of CONFIG.cleanupFiles) {
    if (safeUnlink(filePath)) {
      removedCount++;
    }
  }

  if (removedCount > 0) {
    log.info(`Cleaned up ${removedCount} unnecessary file(s)`);
  }
}

// ============================================================================
// Main execution
// ============================================================================

async function main() {
  // Cross-platform decorative lines
  const line = useColors ? '━'.repeat(60) : '='.repeat(60);
  const title = `${icons.tool} OpenAPI TypeScript Generator`;
  
  console.log(`\n${colorize(title, '1')}\n`);

  try {
    // Step 1: Validate configuration
    log.step(1, 'Validating configuration...');
    const swaggerUrl = validateAndNormalizeUrl(process.env.SWAGGER_DOCS_HOST);
    log.success(`Target: ${swaggerUrl}`);

    // Step 2: Ensure output directory exists
    log.step(2, 'Preparing output directory...');
    ensureDirectoryExists(CONFIG.outputDir);

    // Step 3: Fetch and validate OpenAPI spec
    log.step(3, 'Fetching OpenAPI specification...');
    const spec = await fetchOpenApiSpec(swaggerUrl);
    const version = spec.openapi || spec.swagger;
    const apiTitle = spec.info?.title || 'Unknown API';
    log.success(`Found: ${apiTitle} (OpenAPI ${version})`);

    // Step 4: Generate TypeScript code
    log.step(4, 'Generating TypeScript API client...');
    const exitCode = await runGenerator(swaggerUrl, CONFIG.outputDir);

    if (exitCode !== 0) {
      throw new Error(`Generator exited with code ${exitCode}`);
    }

    // Step 5: Cleanup
    log.step(5, 'Cleaning up...');
    cleanupGeneratedFiles();

    // Done - Success
    console.log(`\n${colorize(line, '32')}`);
    log.success('API client generated successfully!');
    console.log(`   Output: ${path.resolve(CONFIG.outputDir)}`);
    console.log(`${colorize(line, '32')}\n`);

    process.exit(0);
  } catch (err) {
    // Error
    console.log(`\n${colorize(line, '31')}`);
    log.error(`Generation failed: ${err.message}`);

    if (err.cause) {
      console.error('   Cause:', err.cause);
    }

    console.log(`${colorize(line, '31')}\n`);
    process.exit(1);
  }
}

// Run if executed directly (not imported)
main();
