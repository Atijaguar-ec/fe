#!/usr/bin/env ts-node
/**
 * 🌍 Chain Translation Synchronization Script
 * 
 * Professional-grade script to sync translations across multiple value chains
 * (cocoa, shrimp, coffee) while maintaining a base translation file.
 * 
 * Architecture:
 * - Base translations (_base/es.base.json, _base/en.base.json)
 * - Chain-specific overrides (defined in chain-overrides.config.ts)
 * - Output: Complete translation files per chain (cocoa/es.json, shrimp/es.json, etc.)
 * 
 * Features:
 * - Type-safe configuration
 * - Validation of translation keys
 * - Detection of missing translations
 * - Beautiful CLI output with colors
 * - Dry-run mode for testing
 * - Diff detection
 * 
 * @author INATrace DevOps Team
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ChainOverrides, loadChainOverrides } from './chain-overrides.config';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const LOCALE_DIR = path.resolve(__dirname, '../../src/assets/locale');
const BASE_DIR = path.join(LOCALE_DIR, '_base');
const CHAINS = ['cocoa', 'shrimp', 'coffee'] as const;
const LANGUAGES = ['es', 'en'] as const;

type Chain = typeof CHAINS[number];
type Language = typeof LANGUAGES[number];

// ============================================================================
// INTERFACES
// ============================================================================

interface TranslationFile {
  locale: string;
  translations: Record<string, string>;
}

interface SyncStats {
  chain: Chain;
  language: Language;
  totalKeys: number;
  overriddenKeys: number;
  addedKeys: number;
  removedKeys: number;
}

interface SyncResult {
  success: boolean;
  stats: SyncStats[];
  errors: string[];
  warnings: string[];
}

// ============================================================================
// UTILITIES
// ============================================================================

class Logger {
  private static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  };

  static info(message: string): void {
    console.log(`${this.colors.blue}ℹ${this.colors.reset} ${message}`);
  }

  static success(message: string): void {
    console.log(`${this.colors.green}✓${this.colors.reset} ${message}`);
  }

  static warning(message: string): void {
    console.log(`${this.colors.yellow}⚠${this.colors.reset} ${message}`);
  }

  static error(message: string): void {
    console.log(`${this.colors.red}✗${this.colors.reset} ${message}`);
  }

  static header(message: string): void {
    console.log(`\n${this.colors.bright}${this.colors.cyan}${message}${this.colors.reset}`);
  }

  static subheader(message: string): void {
    console.log(`${this.colors.magenta}${message}${this.colors.reset}`);
  }
}

class FileUtils {
  static ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      Logger.info(`Created directory: ${dirPath}`);
    }
  }

  static readJSON<T>(filePath: string): T {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
    }
  }

  static writeJSON(filePath: string, data: any, prettyPrint = true): void {
    try {
      const content = prettyPrint 
        ? JSON.stringify(data, null, 2) 
        : JSON.stringify(data);
      fs.writeFileSync(filePath, content + '\n', 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
    }
  }

  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

class TranslationValidator {
  /**
   * Validate that all chains have the same keys
   */
  static validateCompleteness(
    baseKeys: string[],
    chainKeys: Record<Chain, Record<Language, string[]>>
  ): string[] {
    const warnings: string[] = [];

    for (const chain of CHAINS) {
      for (const lang of LANGUAGES) {
        const keys = chainKeys[chain][lang];
        const missingInChain = baseKeys.filter(k => !keys.includes(k));
        const extraInChain = keys.filter(k => !baseKeys.includes(k));

        if (missingInChain.length > 0) {
          warnings.push(
            `Chain "${chain}" (${lang}) is missing ${missingInChain.length} keys from base`
          );
        }

        if (extraInChain.length > 0) {
          warnings.push(
            `Chain "${chain}" (${lang}) has ${extraInChain.length} extra keys not in base`
          );
        }
      }
    }

    return warnings;
  }

  /**
   * Validate override keys exist in base
   */
  static validateOverrides(
    baseKeys: string[],
    overrides: ChainOverrides
  ): string[] {
    const errors: string[] = [];

    for (const chain of CHAINS) {
      const chainOverrides = overrides[chain];
      if (!chainOverrides) continue;

      for (const lang of LANGUAGES) {
        const langOverrides = chainOverrides[lang];
        if (!langOverrides) continue;

        const overrideKeys = Object.keys(langOverrides);
        const invalidKeys = overrideKeys.filter(k => !baseKeys.includes(k));

        if (invalidKeys.length > 0) {
          errors.push(
            `Chain "${chain}" (${lang}) has ${invalidKeys.length} override keys not found in base: ${invalidKeys.slice(0, 3).join(', ')}${invalidKeys.length > 3 ? '...' : ''}`
          );
        }
      }
    }

    return errors;
  }
}

// ============================================================================
// SYNCHRONIZATION ENGINE
// ============================================================================

class TranslationSyncEngine {
  private baseTranslations: Record<Language, TranslationFile> = {} as any;
  private overrides: ChainOverrides;
  private dryRun: boolean;
  private verbose: boolean;

  constructor(options: { dryRun?: boolean; verbose?: boolean } = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
  }

  async sync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      stats: [],
      errors: [],
      warnings: []
    };

    try {
      Logger.header('🌍 INATrace Chain Translation Synchronization');
      
      // Step 1: Load base translations
      Logger.subheader('\n📖 Step 1: Loading base translations...');
      this.loadBaseTranslations();
      Logger.success(`Loaded base translations for ${LANGUAGES.length} languages`);

      // Step 2: Load overrides configuration
      Logger.subheader('\n⚙️ Step 2: Loading chain overrides configuration...');
      this.overrides = loadChainOverrides();
      Logger.success('Loaded overrides configuration');

      // Step 3: Validate overrides
      Logger.subheader('\n✓ Step 3: Validating overrides...');
      const baseKeys = Object.keys(this.baseTranslations.es.translations);
      const validationErrors = TranslationValidator.validateOverrides(baseKeys, this.overrides);
      
      if (validationErrors.length > 0) {
        validationErrors.forEach(err => Logger.error(err));
        result.errors.push(...validationErrors);
        result.success = false;
        return result;
      }
      Logger.success('All overrides are valid');

      // Step 4: Sync each chain
      Logger.subheader('\n🔄 Step 4: Synchronizing translations...');
      for (const chain of CHAINS) {
        for (const lang of LANGUAGES) {
          const stats = await this.syncChain(chain, lang);
          result.stats.push(stats);
        }
      }

      // Step 5: Final validation
      Logger.subheader('\n🔍 Step 5: Final validation...');
      const chainKeys: Record<Chain, Record<Language, string[]>> = {} as any;
      for (const chain of CHAINS) {
        chainKeys[chain] = {} as any;
        for (const lang of LANGUAGES) {
          const filePath = path.join(LOCALE_DIR, chain, `${lang}.json`);
          const chainFile = FileUtils.readJSON<TranslationFile>(filePath);
          chainKeys[chain][lang] = Object.keys(chainFile.translations);
        }
      }

      const warnings = TranslationValidator.validateCompleteness(baseKeys, chainKeys);
      if (warnings.length > 0) {
        warnings.forEach(warn => Logger.warning(warn));
        result.warnings.push(...warnings);
      } else {
        Logger.success('All chains have consistent keys');
      }

      // Print summary
      this.printSummary(result);

    } catch (error) {
      Logger.error(`Sync failed: ${error.message}`);
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  private loadBaseTranslations(): void {
    for (const lang of LANGUAGES) {
      const filePath = path.join(BASE_DIR, `${lang}.base.json`);
      
      if (!FileUtils.fileExists(filePath)) {
        throw new Error(`Base translation file not found: ${filePath}`);
      }

      this.baseTranslations[lang] = FileUtils.readJSON<TranslationFile>(filePath);
      
      if (this.verbose) {
        const keyCount = Object.keys(this.baseTranslations[lang].translations).length;
        Logger.info(`  ${lang}: ${keyCount} keys`);
      }
    }
  }

  private async syncChain(chain: Chain, lang: Language): Promise<SyncStats> {
    const chainDir = path.join(LOCALE_DIR, chain);
    const outputPath = path.join(chainDir, `${lang}.json`);

    // Ensure chain directory exists
    FileUtils.ensureDir(chainDir);

    // Get base translations
    const baseTranslations = { ...this.baseTranslations[lang].translations };
    const totalKeys = Object.keys(baseTranslations).length;

    // Apply overrides
    const chainOverrides = this.overrides[chain]?.[lang] || {};
    const overriddenKeys = Object.keys(chainOverrides).length;

    const finalTranslations = {
      ...baseTranslations,
      ...chainOverrides
    };

    // Apply bulk replacements for specific chains
    this.applyBulkReplacements(chain, lang, finalTranslations);

    // Create output object
    const output: TranslationFile = {
      locale: lang,
      translations: finalTranslations
    };

    // Detect changes
    let addedKeys = 0;
    let removedKeys = 0;

    if (FileUtils.fileExists(outputPath)) {
      const existing = FileUtils.readJSON<TranslationFile>(outputPath);
      const existingKeys = Object.keys(existing.translations);
      const newKeys = Object.keys(finalTranslations);

      addedKeys = newKeys.filter(k => !existingKeys.includes(k)).length;
      removedKeys = existingKeys.filter(k => !newKeys.includes(k)).length;
    } else {
      addedKeys = totalKeys;
    }

    // Write file (unless dry-run)
    if (!this.dryRun) {
      FileUtils.writeJSON(outputPath, output);
      Logger.success(`  ${chain}/${lang}.json: ${totalKeys} keys (${overriddenKeys} overrides, +${addedKeys}, -${removedKeys})`);
    } else {
      Logger.info(`  [DRY RUN] Would write ${chain}/${lang}.json: ${totalKeys} keys (${overriddenKeys} overrides, +${addedKeys}, -${removedKeys})`);
    }

    return {
      chain,
      language: lang,
      totalKeys,
      overriddenKeys,
      addedKeys,
      removedKeys
    };
  }

  /**
   * Apply bulk string replacements for specific chains
   * This is useful for systematic terminology changes (e.g., Agricultor → Proveedor for shrimp)
   */
  private applyBulkReplacements(chain: Chain, lang: Language, translations: Record<string, string>): void {
    // Define bulk replacements per chain
    const bulkReplacements: Record<Chain, Record<Language, Array<{ search: string; replace: string }>>> = {
      cocoa: { es: [], en: [] },
      coffee: { es: [], en: [] },
      shrimp: {
        es: [
          { search: 'Agricultor', replace: 'Proveedor' },
          { search: 'agricultor', replace: 'proveedor' },
          { search: 'Agricultores', replace: 'Proveedores' },
          { search: 'agricultores', replace: 'proveedores' },
          { search: 'Piscicultor', replace: 'Proveedor' },
          { search: 'piscicultor', replace: 'proveedor' },
          { search: 'Piscicultores', replace: 'Proveedores' },
          { search: 'piscicultores', replace: 'proveedores' },
        ],
        en: [
          { search: 'Farmer', replace: 'Supplier' },
          { search: 'farmer', replace: 'supplier' },
          { search: 'Farmers', replace: 'Suppliers' },
          { search: 'farmers', replace: 'suppliers' },
          { search: 'Fish farmer', replace: 'Supplier' },
          { search: 'fish farmer', replace: 'supplier' },
          { search: 'Fish farmers', replace: 'Suppliers' },
          { search: 'fish farmers', replace: 'suppliers' },
        ]
      }
    };

    const replacements = bulkReplacements[chain]?.[lang] || [];
    
    if (replacements.length === 0) {
      return;
    }

    // Apply replacements to all translation values
    let replacementCount = 0;
    for (const key in translations) {
      const originalValue = translations[key];
      let newValue = originalValue;

      for (const { search, replace } of replacements) {
        if (newValue.includes(search)) {
          newValue = newValue.split(search).join(replace);
          replacementCount++;
        }
      }

      if (newValue !== originalValue) {
        translations[key] = newValue;
      }
    }

    if (this.verbose && replacementCount > 0) {
      Logger.info(`  Applied ${replacementCount} bulk replacements for ${chain}/${lang}`);
    }
  }

  private printSummary(result: SyncResult): void {
    Logger.header('\n📊 Synchronization Summary');
    
    console.log('\n╔═══════════╦════════╦══════════╦════════════╦════════════╗');
    console.log('║   Chain   ║  Lang  ║   Keys   ║  Overrides ║   Changes  ║');
    console.log('╠═══════════╬════════╬══════════╬════════════╬════════════╣');
    
    for (const stats of result.stats) {
      const changes = stats.addedKeys > 0 || stats.removedKeys > 0 
        ? `+${stats.addedKeys}/-${stats.removedKeys}`
        : 'none';
      
      console.log(
        `║ ${stats.chain.padEnd(9)} ║ ${stats.language.padEnd(6)} ║ ${String(stats.totalKeys).padStart(8)} ║ ${String(stats.overriddenKeys).padStart(10)} ║ ${changes.padStart(10)} ║`
      );
    }
    
    console.log('╚═══════════╩════════╩══════════╩════════════╩════════════╝\n');

    if (result.errors.length > 0) {
      Logger.error(`\n❌ ${result.errors.length} errors occurred`);
      result.success = false;
    } else if (result.warnings.length > 0) {
      Logger.warning(`\n⚠️  ${result.warnings.length} warnings (non-blocking)`);
    } else {
      Logger.success('\n✅ Sync completed successfully!');
    }

    if (this.dryRun) {
      Logger.info('\n🔍 This was a DRY RUN - no files were modified');
    }
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const verbose = args.includes('--verbose') || args.includes('-v');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║        INATrace Chain Translation Synchronization Tool         ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  npm run translations:sync [options]

Options:
  --dry-run, -d     Show what would be done without writing files
  --verbose, -v     Show detailed output
  --help, -h        Show this help message

Examples:
  npm run translations:sync
  npm run translations:sync --dry-run
  npm run translations:sync --verbose
  npm run translations:sync --dry-run --verbose
`);
    process.exit(0);
  }

  const engine = new TranslationSyncEngine({ dryRun, verbose });
  const result = await engine.sync();

  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    Logger.error(`Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

export { TranslationSyncEngine, SyncResult, SyncStats };
