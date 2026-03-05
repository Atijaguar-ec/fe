#!/usr/bin/env ts-node
/**
 * 🔄 Chain Switcher - Quick Development Chain Selector
 * 
 * Utility to quickly switch between chains during development.
 * Updates env.js with the selected chain and optionally starts dev server.
 * 
 * Usage:
 *   npm run chain:switch cocoa
 *   npm run chain:switch shrimp --start
 *   npm run chain:switch coffee
 * 
 * @author INATrace DevOps Team
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// CONSTANTS
// ============================================================================

const CHAINS = ['cocoa', 'shrimp', 'coffee'] as const;
type Chain = typeof CHAINS[number];

const CHAIN_NAMES = {
  cocoa: { es: 'Cacao', en: 'Cocoa' },
  shrimp: { es: 'Camarón', en: 'Shrimp' },
  coffee: { es: 'Café', en: 'Coffee' }
};

const ENV_FILE = path.resolve(__dirname, '../../src/assets/env.js');

// ============================================================================
// LOGGER
// ============================================================================

class Logger {
  private static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
  };

  static info(message: string): void {
    console.log(`${this.colors.blue}ℹ${this.colors.reset} ${message}`);
  }

  static success(message: string): void {
    console.log(`${this.colors.green}✓${this.colors.reset} ${message}`);
  }

  static error(message: string): void {
    console.log(`${this.colors.red}✗${this.colors.reset} ${message}`);
  }

  static header(message: string): void {
    console.log(`\n${this.colors.bright}${this.colors.cyan}${message}${this.colors.reset}`);
  }

  static command(message: string): void {
    console.log(`${this.colors.magenta}$${this.colors.reset} ${message}`);
  }
}

// ============================================================================
// CHAIN SWITCHER
// ============================================================================

class ChainSwitcher {
  private chain: Chain;
  private startServer: boolean;

  constructor(chain: Chain, options: { start?: boolean } = {}) {
    this.chain = chain;
    this.startServer = options.start || false;
  }

  async switch(): Promise<void> {
    Logger.header('🔄 INATrace Chain Switcher');
    
    console.log(`\n📦 Switching to: ${this.colors.bright}${CHAIN_NAMES[this.chain].es} (${this.chain.toUpperCase()})${this.colors.reset}`);

    // Step 1: Update env.js
    Logger.info('\n📝 Step 1: Updating env.js...');
    this.updateEnvFile();
    Logger.success(`env.js updated with PRIMARY_PRODUCT_TYPE=${this.chain.toUpperCase()}`);

    // Step 2: Sync translations
    Logger.info('\n🌍 Step 2: Syncing translations...');
    try {
      execSync('npm run translations:sync', { 
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..')
      });
      Logger.success('Translations synced');
    } catch (error) {
      Logger.error('Failed to sync translations');
      throw error;
    }

    // Step 3: Summary
    this.printSummary();

    // Step 4: Start server if requested
    if (this.startServer) {
      Logger.info('\n🚀 Starting development server...\n');
      Logger.command(`npm run dev:${this.chain}`);
      console.log();
      
      try {
        execSync(`npm run dev:${this.chain}`, {
          stdio: 'inherit',
          cwd: path.resolve(__dirname, '../..')
        });
      } catch (error) {
        // User likely pressed Ctrl+C, normal exit
        process.exit(0);
      }
    }
  }

  private updateEnvFile(): void {
    if (!fs.existsSync(ENV_FILE)) {
      throw new Error(`env.js not found at ${ENV_FILE}`);
    }

    let content = fs.readFileSync(ENV_FILE, 'utf-8');
    
    // Replace PRIMARY_PRODUCT_TYPE
    const regex = /window\['env'\]\['PRIMARY_PRODUCT_TYPE'\]\s*=\s*'(COCOA|SHRIMP|COFFEE)'/;
    const newValue = this.chain.toUpperCase();
    
    if (!regex.test(content)) {
      throw new Error('PRIMARY_PRODUCT_TYPE not found in env.js');
    }

    content = content.replace(regex, `window['env']['PRIMARY_PRODUCT_TYPE'] = '${newValue}'`);
    
    fs.writeFileSync(ENV_FILE, content, 'utf-8');
  }

  private printSummary(): void {
    const chainName = CHAIN_NAMES[this.chain];
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`${this.colors.green}✅ Successfully switched to ${chainName.es}!${this.colors.reset}`);
    console.log(`${'═'.repeat(60)}`);
    
    console.log(`\n📋 Next steps:`);
    
    if (!this.startServer) {
      console.log(`\n   ${this.colors.cyan}Option 1:${this.colors.reset} Start development server`);
      Logger.command(`npm run dev:${this.chain}`);
      
      console.log(`\n   ${this.colors.cyan}Option 2:${this.colors.reset} Use short alias`);
      Logger.command(`npm run ${chainName.es.toLowerCase()}`);
      
      console.log(`\n   ${this.colors.cyan}Option 3:${this.colors.reset} Switch and start in one command`);
      Logger.command(`npm run chain:switch ${this.chain} -- --start`);
    }
    
    console.log(`\n   ${this.colors.cyan}Build for production:${this.colors.reset}`);
    Logger.command(`npm run build:${this.chain}`);
    
    console.log();
  }

  private get colors() {
    return {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      green: '\x1b[32m',
      cyan: '\x1b[36m'
    };
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║              INATrace Chain Switcher - Quick Dev               ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  npm run chain:switch <chain> [options]

Chains:
  cocoa      🍫 Cacao chain
  shrimp     🦐 Shrimp/Camarón chain
  coffee     ☕ Coffee/Café chain

Options:
  --start, -s    Start development server after switching
  --help, -h     Show this help message

Examples:
  npm run chain:switch shrimp
  npm run chain:switch cocoa --start
  npm run chain:switch coffee -s

Aliases (switch + start):
  npm run cacao     → Switch to cocoa and start
  npm run camaron   → Switch to shrimp and start
  npm run cafe      → Switch to coffee and start
`);
    process.exit(0);
  }

  const chainArg = args[0].toLowerCase();
  const startServer = args.includes('--start') || args.includes('-s');

  if (!CHAINS.includes(chainArg as Chain)) {
    Logger.error(`Invalid chain: ${chainArg}`);
    console.log(`Valid chains: ${CHAINS.join(', ')}`);
    process.exit(1);
  }

  const switcher = new ChainSwitcher(chainArg as Chain, { start: startServer });
  await switcher.switch();
}

// Run
if (require.main === module) {
  main().catch(error => {
    Logger.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  });
}

export { ChainSwitcher };
