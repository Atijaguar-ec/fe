#!/usr/bin/env ts-node
/**
 * 🔍 Chain Translation Validation Script
 * 
 * Validates that all translation files are consistent and complete.
 * 
 * Checks:
 * - All chains have translations for all languages
 * - All chains have the same keys
 * - No missing translations
 * - No extra keys
 * - Valid JSON format
 * - Correct file structure
 * 
 * Usage:
 *   npm run translations:validate
 *   npm run translations:validate --strict
 * 
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 *   2 - Warnings found (only fails in --strict mode)
 * 
 * @author INATrace DevOps Team
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
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

interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'MISSING_FILE' | 'INVALID_JSON' | 'MISSING_KEYS' | 'INVALID_STRUCTURE';
  message: string;
  chain?: Chain;
  language?: Language;
  details?: any;
}

interface ValidationWarning {
  type: 'EXTRA_KEYS' | 'INCONSISTENT_KEYS' | 'EMPTY_TRANSLATION';
  message: string;
  chain?: Chain;
  language?: Language;
  details?: any;
}

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
}

// ============================================================================
// VALIDATORS
// ============================================================================

class TranslationValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private baseKeys: Record<Language, string[]> = {} as any;
  private chainKeys: Record<Chain, Record<Language, string[]>> = {} as any;

  async validate(): Promise<ValidationResult> {
    Logger.header('🔍 INATrace Translation Validation');

    try {
      // Step 1: Validate base files exist and are valid
      Logger.info('\n📖 Step 1: Validating base translation files...');
      await this.validateBaseFiles();

      // Step 2: Validate chain files
      Logger.info('\n📦 Step 2: Validating chain translation files...');
      await this.validateChainFiles();

      // Step 3: Cross-validate consistency
      Logger.info('\n🔄 Step 3: Cross-validating consistency...');
      await this.validateConsistency();

      // Step 4: Check for empty translations
      Logger.info('\n📝 Step 4: Checking for empty translations...');
      await this.checkEmptyTranslations();

      // Report results
      this.printResults();

    } catch (error) {
      Logger.error(`Validation failed with exception: ${(error as Error).message}`);
      this.errors.push({
        type: 'INVALID_STRUCTURE',
        message: `Fatal error during validation: ${(error as Error).message}`
      });
    }

    return {
      passed: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  private async validateBaseFiles(): Promise<void> {
    for (const lang of LANGUAGES) {
      const filePath = path.join(BASE_DIR, `${lang}.base.json`);

      if (!fs.existsSync(filePath)) {
        this.errors.push({
          type: 'MISSING_FILE',
          message: `Base file missing: ${lang}.base.json`,
          language: lang
        });
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content) as TranslationFile;

        if (!data.locale || !data.translations) {
          this.errors.push({
            type: 'INVALID_STRUCTURE',
            message: `Base file ${lang}.base.json has invalid structure`,
            language: lang
          });
          continue;
        }

        this.baseKeys[lang] = Object.keys(data.translations);
        Logger.success(`  ${lang}.base.json: ${this.baseKeys[lang].length} keys`);

      } catch (error) {
        this.errors.push({
          type: 'INVALID_JSON',
          message: `Base file ${lang}.base.json is not valid JSON`,
          language: lang,
          details: (error as Error).message
        });
      }
    }
  }

  private async validateChainFiles(): Promise<void> {
    for (const chain of CHAINS) {
      this.chainKeys[chain] = {} as any;

      for (const lang of LANGUAGES) {
        const filePath = path.join(LOCALE_DIR, chain, `${lang}.json`);

        if (!fs.existsSync(filePath)) {
          this.errors.push({
            type: 'MISSING_FILE',
            message: `Chain file missing: ${chain}/${lang}.json`,
            chain,
            language: lang
          });
          continue;
        }

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content) as TranslationFile;

          if (!data.locale || !data.translations) {
            this.errors.push({
              type: 'INVALID_STRUCTURE',
              message: `Chain file ${chain}/${lang}.json has invalid structure`,
              chain,
              language: lang
            });
            continue;
          }

          this.chainKeys[chain][lang] = Object.keys(data.translations);
          Logger.success(`  ${chain}/${lang}.json: ${this.chainKeys[chain][lang].length} keys`);

        } catch (error) {
          this.errors.push({
            type: 'INVALID_JSON',
            message: `Chain file ${chain}/${lang}.json is not valid JSON`,
            chain,
            language: lang,
            details: (error as Error).message
          });
        }
      }
    }
  }

  private async validateConsistency(): Promise<void> {
    // Check that all chains have the same keys as base
    for (const chain of CHAINS) {
      for (const lang of LANGUAGES) {
        if (!this.baseKeys[lang] || !this.chainKeys[chain]?.[lang]) {
          continue; // Already reported as error
        }

        const baseSet = new Set(this.baseKeys[lang]);
        const chainSet = new Set(this.chainKeys[chain][lang]);

        // Check for missing keys
        const missingKeys = this.baseKeys[lang].filter(k => !chainSet.has(k));
        if (missingKeys.length > 0) {
          this.errors.push({
            type: 'MISSING_KEYS',
            message: `Chain ${chain}/${lang}.json is missing ${missingKeys.length} keys from base`,
            chain,
            language: lang,
            details: missingKeys.slice(0, 5)
          });
        }

        // Check for extra keys
        const extraKeys = this.chainKeys[chain][lang].filter(k => !baseSet.has(k));
        if (extraKeys.length > 0) {
          this.warnings.push({
            type: 'EXTRA_KEYS',
            message: `Chain ${chain}/${lang}.json has ${extraKeys.length} extra keys not in base`,
            chain,
            language: lang,
            details: extraKeys.slice(0, 5)
          });
        }
      }
    }

    // Check that all chains have the same keys among themselves
    const firstChain = CHAINS[0];
    for (let i = 1; i < CHAINS.length; i++) {
      const chain = CHAINS[i];
      
      for (const lang of LANGUAGES) {
        if (!this.chainKeys[firstChain]?.[lang] || !this.chainKeys[chain]?.[lang]) {
          continue;
        }

        const firstSet = new Set(this.chainKeys[firstChain][lang]);
        const chainSet = new Set(this.chainKeys[chain][lang]);

        const diff1 = this.chainKeys[firstChain][lang].filter(k => !chainSet.has(k));
        const diff2 = this.chainKeys[chain][lang].filter(k => !firstSet.has(k));

        if (diff1.length > 0 || diff2.length > 0) {
          this.warnings.push({
            type: 'INCONSISTENT_KEYS',
            message: `Chains ${firstChain} and ${chain} have inconsistent keys in ${lang}`,
            details: {
              onlyInFirst: diff1.slice(0, 3),
              onlyInSecond: diff2.slice(0, 3)
            }
          });
        }
      }
    }
  }

  private async checkEmptyTranslations(): Promise<void> {
    for (const chain of CHAINS) {
      for (const lang of LANGUAGES) {
        const filePath = path.join(LOCALE_DIR, chain, `${lang}.json`);
        
        if (!fs.existsSync(filePath)) {
          continue;
        }

        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TranslationFile;
          const emptyKeys = Object.entries(data.translations)
            .filter(([_, value]) => !value || value.trim() === '')
            .map(([key]) => key);

          if (emptyKeys.length > 0) {
            this.warnings.push({
              type: 'EMPTY_TRANSLATION',
              message: `Chain ${chain}/${lang}.json has ${emptyKeys.length} empty translations`,
              chain,
              language: lang,
              details: emptyKeys.slice(0, 5)
            });
          }
        } catch {
          // Already reported as JSON error
        }
      }
    }
  }

  private printResults(): void {
    Logger.header('\n📊 Validation Results');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      Logger.success('\n✅ All validations passed! Translations are consistent and complete.');
      return;
    }

    if (this.errors.length > 0) {
      console.log(`\n${Logger['colors'].red}╔═══════════════════════════════════════════════════════════╗${Logger['colors'].reset}`);
      console.log(`${Logger['colors'].red}║                    ❌ ERRORS FOUND                        ║${Logger['colors'].reset}`);
      console.log(`${Logger['colors'].red}╚═══════════════════════════════════════════════════════════╝${Logger['colors'].reset}\n`);

      this.errors.forEach((error, index) => {
        Logger.error(`${index + 1}. [${error.type}] ${error.message}`);
        if (error.details) {
          console.log(`   Details: ${JSON.stringify(error.details, null, 2)}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n${Logger['colors'].yellow}╔═══════════════════════════════════════════════════════════╗${Logger['colors'].reset}`);
      console.log(`${Logger['colors'].yellow}║                  ⚠️  WARNINGS FOUND                       ║${Logger['colors'].reset}`);
      console.log(`${Logger['colors'].yellow}╚═══════════════════════════════════════════════════════════╝${Logger['colors'].reset}\n`);

      this.warnings.forEach((warning, index) => {
        Logger.warning(`${index + 1}. [${warning.type}] ${warning.message}`);
        if (warning.details) {
          console.log(`   Details: ${JSON.stringify(warning.details, null, 2)}`);
        }
      });
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`Total errors: ${this.errors.length}`);
    console.log(`Total warnings: ${this.warnings.length}`);
    console.log('═'.repeat(60) + '\n');
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict') || args.includes('-s');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║           INATrace Translation Validation Tool                 ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  npm run translations:validate [options]

Options:
  --strict, -s      Treat warnings as errors (fail on warnings)
  --help, -h        Show this help message

Examples:
  npm run translations:validate
  npm run translations:validate --strict
`);
    process.exit(0);
  }

  const validator = new TranslationValidator();
  const result = await validator.validate();

  if (!result.passed) {
    process.exit(1);
  }

  if (strict && result.warnings.length > 0) {
    Logger.error('\n❌ Strict mode: Failing due to warnings');
    process.exit(2);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    Logger.error(`Fatal error: ${(error as Error).message}`);
    console.error((error as Error).stack);
    process.exit(1);
  });
}

export { TranslationValidator, ValidationResult };
