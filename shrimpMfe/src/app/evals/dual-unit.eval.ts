/**
 * 🦐 Eval 2: Dual Unit Serialization Oracle
 * 
 * EDD (Eval-Driven Development) — Shrimp Value Chain (Dufer)
 * 
 * PURPOSE: Validates that LotNumberUtil.packDualUnitComment() correctly
 * serializes multimodal measurement data (cajetas/libras) into a JSON
 * string suitable for the StockOrder.comments field.
 * 
 * This is critical because Dufer's classification uses TWO measurement modes:
 *   - Cajetas (discrete manual count for Bloque)
 *   - Libras  (volumetric weighing for IQF/VA/Salmuera)
 * 
 * The serialized payload must be parseable and contain the version marker.
 * 
 * SCORING: Each scenario contributes to a 0–1.0 score.
 * 
 * LIFECYCLE: Run with: npx ts-node shrimpMfe/src/app/evals/dual-unit.eval.ts
 */

import { LotNumberUtil } from '../utils/lot-number.util';

// ─── Eval Harness ────────────────────────────────────────────────────

interface DualUnitScenario {
  name: string;
  input: { weightLbs: number; boxesCount: number };
  checks: {
    isParseable: boolean;
    dualUnit?: boolean;
    lbs?: number;
    cajetas?: number;
    version?: number;
  };
  weight: number;
}

const scenarios: DualUnitScenario[] = [
  {
    name: 'Normal values: 300 lbs, 60 cajetas',
    input: { weightLbs: 300, boxesCount: 60 },
    checks: {
      isParseable: true,
      dualUnit: true,
      lbs: 300,
      cajetas: 60,
      version: 1,
    },
    weight: 0.25,
  },
  {
    name: 'Zero cajetas (IQF/Salmuera — no box count)',
    input: { weightLbs: 500, boxesCount: 0 },
    checks: {
      isParseable: true,
      dualUnit: true,
      lbs: 500,
      cajetas: 0,
      version: 1,
    },
    weight: 0.20,
  },
  {
    name: 'Zero libras (edge: no weight recorded)',
    input: { weightLbs: 0, boxesCount: 10 },
    checks: {
      isParseable: true,
      dualUnit: true,
      lbs: 0,
      cajetas: 10,
      version: 1,
    },
    weight: 0.15,
  },
  {
    name: 'Decimal libras: 250.5 lbs',
    input: { weightLbs: 250.5, boxesCount: 50 },
    checks: {
      isParseable: true,
      dualUnit: true,
      lbs: 250.5,
      cajetas: 50,
      version: 1,
    },
    weight: 0.15,
  },
  {
    name: 'Large values: 10000 lbs, 2000 cajetas',
    input: { weightLbs: 10000, boxesCount: 2000 },
    checks: {
      isParseable: true,
      dualUnit: true,
      lbs: 10000,
      cajetas: 2000,
      version: 1,
    },
    weight: 0.10,
  },
  {
    name: 'Both zero (edge case)',
    input: { weightLbs: 0, boxesCount: 0 },
    checks: {
      isParseable: true,
      dualUnit: true,
      lbs: 0,
      cajetas: 0,
      version: 1,
    },
    weight: 0.10,
  },
  {
    name: 'Output is valid JSON string',
    input: { weightLbs: 100, boxesCount: 20 },
    checks: { isParseable: true },
    weight: 0.05,
  },
];

// ─── Run Eval ────────────────────────────────────────────────────────

function runEval(): { score: number; total: number; results: string[] } {
  let score = 0;
  const results: string[] = [];

  for (const scenario of scenarios) {
    const raw = LotNumberUtil.packDualUnitComment(
      scenario.input.weightLbs,
      scenario.input.boxesCount
    );

    let passed = true;
    const errors: string[] = [];

    // Check parseability
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      passed = false;
      errors.push(`Not valid JSON: "${raw}"`);
    }

    if (parsed && scenario.checks.isParseable) {
      // Check individual fields
      if (scenario.checks.dualUnit !== undefined && parsed.dualUnit !== scenario.checks.dualUnit) {
        passed = false;
        errors.push(`dualUnit: expected ${scenario.checks.dualUnit}, got ${parsed.dualUnit}`);
      }
      if (scenario.checks.lbs !== undefined && parsed.lbs !== scenario.checks.lbs) {
        passed = false;
        errors.push(`lbs: expected ${scenario.checks.lbs}, got ${parsed.lbs}`);
      }
      if (scenario.checks.cajetas !== undefined && parsed.cajetas !== scenario.checks.cajetas) {
        passed = false;
        errors.push(`cajetas: expected ${scenario.checks.cajetas}, got ${parsed.cajetas}`);
      }
      if (scenario.checks.version !== undefined && parsed.v !== scenario.checks.version) {
        passed = false;
        errors.push(`version: expected ${scenario.checks.version}, got ${parsed.v}`);
      }
    }

    if (passed) {
      score += scenario.weight;
      results.push(`  ✅ ${scenario.name}`);
    } else {
      results.push(
        `  ❌ ${scenario.name}\n` +
        errors.map((e) => `     ${e}`).join('\n')
      );
    }
  }

  const total = scenarios.reduce((sum, s) => sum + s.weight, 0);
  return { score, total, results };
}

// ─── Output ──────────────────────────────────────────────────────────

const { score, total, results } = runEval();
const percentage = Math.round((score / total) * 100);

console.log('\n🦐 EDD Eval: Dual Unit Serialization');
console.log('═'.repeat(50));
results.forEach((r) => console.log(r));
console.log('═'.repeat(50));
console.log(`Score: ${score.toFixed(2)} / ${total.toFixed(2)} (${percentage}%)`);
console.log(percentage === 100 ? '🎉 ALL PASS' : '⚠️  SOME FAILURES');
console.log('');

process.exit(percentage === 100 ? 0 : 1);
