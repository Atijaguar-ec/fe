# 🛠️ Chain Translations Scripts

Professional tooling for managing multi-chain translations in INATrace.

## 📁 Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `sync-translations.ts` | Syncs base translations + overrides to chain-specific files | After editing base or overrides |
| `validate-translations.ts` | Validates all translation files for consistency | Before commits, in CI/CD |
| `switch-chain.ts` | Quickly switch between chains during development | When changing active chain |
| `chain-overrides.config.ts` | Centralized configuration of chain-specific terminology | When adding/updating overrides |
| `tsconfig.json` | TypeScript config for Node.js scripts | Auto-used by ts-node |

---

## 🚀 Quick Start

### Option 1: Direct Commands (Recommended)

```bash
# Work on Shrimp/Camarón
npm run camaron

# Work on Cocoa/Cacao
npm run cacao

# Work on Coffee/Café
npm run cafe
```

### Option 2: Manual Switch + Start

```bash
# Switch chain
npm run chain:switch shrimp

# Then start
npm run dev:shrimp
```

### Option 3: Switch and Auto-Start

```bash
npm run chain:switch shrimp --start
```

---

## 📝 Common Workflows

### Adding a New Translation

1. **Edit base file:**
   ```bash
   vim src/assets/locale/_base/es.base.json
   ```

2. **Add override if needed** (optional):
   ```typescript
   // scripts/chain-translations/chain-overrides.config.ts
   shrimp: {
     es: {
       'nueva.clave': 'Texto específico para camarón'
     }
   }
   ```

3. **Sync translations:**
   ```bash
   npm run translations:sync
   ```

4. **Validate (optional but recommended):**
   ```bash
   npm run translations:validate
   ```

---

### Switching Between Chains

**Fastest way (aliases):**
```bash
npm run camaron   # Shrimp
npm run cacao     # Cocoa
npm run cafe      # Coffee
```

**Using switcher:**
```bash
npm run chain:switch shrimp
npm run chain:switch cocoa --start
```

**Manual:**
```bash
# Edit src/assets/env.js
PRIMARY_PRODUCT_TYPE = 'SHRIMP'

# Sync and start
npm run translations:sync
npm run dev:shrimp
```

---

## 🔧 Script Details

### sync-translations.ts

**Purpose:** Generates chain-specific translation files by merging base + overrides.

**Usage:**
```bash
npm run translations:sync              # Sync all chains
npm run translations:sync:dry-run      # Preview changes
```

**What it does:**
1. Loads `_base/es.base.json` and `_base/en.base.json`
2. Loads overrides from `chain-overrides.config.ts`
3. Validates overrides exist in base
4. Generates `cocoa/`, `shrimp/`, `coffee/` translation files
5. Validates cross-chain consistency

**Output:**
```
🌍 INATrace Chain Translation Synchronization

✓ cocoa/es.json: 3330 keys (0 overrides)
✓ shrimp/es.json: 3330 keys (46 overrides)
✓ coffee/es.json: 3330 keys (22 overrides)

✅ Sync completed successfully!
```

---

### validate-translations.ts

**Purpose:** Validates translation files for errors and inconsistencies.

**Usage:**
```bash
npm run translations:validate          # Check errors only
npm run translations:validate:strict   # Fail on warnings
```

**Checks:**
- ✅ All base files exist and are valid JSON
- ✅ All chain files exist and are valid JSON
- ✅ Correct structure (`locale` + `translations`)
- ✅ All chains have same keys
- ✅ No missing keys from base
- ⚠️ Warns on extra keys (non-blocking)
- ⚠️ Warns on empty translations (non-blocking)

**Example output:**
```
🔍 INATrace Translation Validation

✓ es.base.json: 3330 keys
✓ shrimp/es.json: 3330 keys
✓ All chains have consistent keys

✅ All validations passed!
```

---

### switch-chain.ts

**Purpose:** Quick development environment switcher.

**Usage:**
```bash
npm run chain:switch <chain> [--start]
```

**Examples:**
```bash
npm run chain:switch shrimp           # Switch only
npm run chain:switch cocoa --start    # Switch + start server
npm run chain:switch coffee -s        # Short flag
```

**What it does:**
1. Updates `src/assets/env.js` with `PRIMARY_PRODUCT_TYPE`
2. Runs `translations:sync` to ensure files are updated
3. Optionally starts dev server with correct configuration
4. Shows helpful next steps

**Output:**
```
🔄 INATrace Chain Switcher

📦 Switching to: Camarón (SHRIMP)
✓ env.js updated
✓ Translations synced

✅ Successfully switched to Camarón!

Next steps:
  $ npm run dev:shrimp
  $ npm run camaron
```

---

### chain-overrides.config.ts

**Purpose:** Single source of truth for terminology differences.

**Structure:**
```typescript
export const CHAIN_OVERRIDES: ChainOverrides = {
  cocoa: {
    es: {},  // No overrides
    en: {}
  },
  shrimp: {
    es: {
      'collectorDetail.roles.farmer': 'Piscicultor',
      // ... 45 more overrides
    },
    en: {
      'collectorDetail.roles.farmer': 'Fish farmer',
      // ... 45 more overrides
    }
  },
  coffee: {
    es: {
      'collectorDetail.roles.farmer': 'Caficultor',
      // ... 21 more overrides
    },
    en: { /* ... */ }
  }
};
```

**When to edit:**
- Adding new terminology differences
- Updating existing overrides
- Adding a new language

**After editing:**
```bash
npm run translations:sync
```

---

## 🎯 Best Practices

### ✅ DO

- **Always edit `_base/*.base.json`** for general changes
- **Use `chain-overrides.config.ts`** for chain-specific terms
- **Run `translations:sync`** after any translation changes
- **Validate before commits** with `translations:validate`
- **Use aliases** (`camaron`, `cacao`, `cafe`) for quick switching
- **Document** why you added an override (comment in config)

### ❌ DON'T

- **Don't edit** `cocoa/`, `shrimp/`, `coffee/` files directly (auto-generated)
- **Don't hardcode** translations in components
- **Don't add overrides** without checking if they exist in base first
- **Don't forget** to sync after changing config

---

## 🔍 Troubleshooting

### Script fails with "Cannot find module 'fs'"

**Cause:** TypeScript config issue  
**Solution:** Already fixed with `scripts/tsconfig.json`

### "Missing keys from base" warning

**Cause:** Translation files out of sync  
**Solution:**
```bash
npm run translations:sync
```

### "Override keys not found in base" error

**Cause:** Override defined for non-existent key  
**Solution:** Add key to `_base/*.base.json` first, then sync

### Changes not reflected in dev server

**Cause:** Using wrong configuration or cache issue  
**Solution:**
```bash
# Stop server (Ctrl+C)
npm run translations:sync
npm run camaron  # Or your chain
```

### cross-env not found

**Cause:** Missing dependency  
**Solution:**
```bash
npm install
```

---

## 📊 Chain Override Statistics

| Chain  | ES Overrides | EN Overrides | Total |
|--------|--------------|--------------|-------|
| Cocoa  | 0            | 0            | 0     |
| Shrimp | 46           | 46           | 92    |
| Coffee | 22           | 22           | 44    |

**Most common override categories:**
- Farmer terminology (Agricultor → Piscicultor/Caficultor)
- Collector terminology (Colector → Acopiador)
- Units of measure (kg → libras for shrimp)
- Delivery terms (Entregas → Cosechas for shrimp)

---

## 🚀 Performance

**Script execution times:**
- `sync-translations`: ~2-3 seconds
- `validate-translations`: ~1-2 seconds  
- `switch-chain`: ~3-4 seconds (includes sync)

**Build impact:**
- Without multi-chain: 240KB translations in bundle
- With multi-chain: 80KB translations per build (66% reduction)

---

## 📚 Related Documentation

- **Main docs:** `/fe/docs/TRADUCCIONES-MULTI-CADENA.md`
- **Architecture:** `/docs/tecnico/arquitectura-multi-cadena.md`
- **Implementation plan:** `/docs/tecnico/plan-implementacion-multi-cadena.md`

---

## 🆘 Support

**Questions or issues?**
1. Check main documentation first
2. Review this README
3. Run scripts with `--help` flag
4. Check console output for specific errors

**Contact:** INATrace DevOps Team

---

**Version:** 1.0.0  
**Last updated:** Nov 2025  
**Status:** ✅ Production Ready
