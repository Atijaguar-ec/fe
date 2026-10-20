/**
 * 🦐 Eval 1: Lot Suffix Rules Oracle
 * 
 * EDD (Eval-Driven Development) — Shrimp Value Chain (Dufer)
 * 
 * PURPOSE: Validates that LotNumberUtil.generateSuffix() correctly produces
 * lot identifiers per Dufer's suffix naming convention:
 *   - Bloque:         Base lot (no suffix)
 *   - IQF:            Base lot + "-2"
 *   - Valor Agregado: Base lot + "-3"
 *   - Salmuera:       Base lot + "-4"
 * 
 * SCORING: Each scenario contributes to a 0–1.0 score.
 *          100% = all business rules pass.
 * 
 * LIFECYCLE: This file lives in the repo but does NOT run in production.
 *            Run with: npx ts-node shrimpMfe/src/app/evals/lot-suffix.eval.ts
 */

import { LotNumberUtil } from '../utils/lot-number.util';

// ─── Eval Harness ────────────────────────────────────────────────────

interface EvalScenario {
  name: string;
  input: { baseLot: string; childIndex: number };
  expected: string;
  weight: number;
}

const scenarios: EvalScenario[] = [
  // ── Core Business Rules (Dufer suffix convention) ──
  {
    name: 'Bloque: base lot without suffix (childIndex=1)',
    input: { baseLot: '250121', childIndex: 1 },
    expected: '250121',
    weight: 0.20,
  },
  {
    name: 'IQF: base lot with suffix -2',
    input: { baseLot: '250121', childIndex: 2 },
    expected: '250121-2',
    weight: 0.20,
  },
  {
    name: 'Valor Agregado: base lot with suffix -3',
    input: { baseLot: '250121', childIndex: 3 },
    expected: '250121-3',
    weight: 0.20,
  },
  {
    name: 'Salmuera: base lot with suffix -4',
    input: { baseLot: '250121', childIndex: 4 },
    expected: '250121-4',
    weight: 0.20,
  },

  // ── Edge Cases ──
  {
    name: 'Empty base lot returns empty string',
    input: { baseLot: '', childIndex: 2 },
    expected: '',
    weight: 0.05,
  },
  {
    name: 'Zero index returns base lot (defensive)',
    input: { baseLot: '250121', childIndex: 0 },
    expected: '250121',
    weight: 0.05,
  },
  {
    name: 'Negative index returns base lot (defensive)',
    input: { baseLot: '250121', childIndex: -1 },
    expected: '250121',
    weight: 0.05,
  },
  {
    name: 'Large index (future extensibility)',
    input: { baseLot: '250215', childIndex: 10 },
    expected: '250215-10',
    weight: 0.05,
  },
];

// ─── Run Eval ────────────────────────────────────────────────────────

function runEval(): { score: number; total: number; results: string[] } {
  let score = 0;
  const results: string[] = [];

  for (const scenario of scenarios) {
    const actual = LotNumberUtil.generateSuffix(
      scenario.input.baseLot,
      scenario.input.childIndex
    );

    const passed = actual === scenario.expected;

    if (passed) {
      score += scenario.weight;
      results.push(`  ✅ ${scenario.name}`);
    } else {
      results.push(
        `  ❌ ${scenario.name}\n` +
        `     Expected: "${scenario.expected}"\n` +
        `     Actual:   "${actual}"`
      );
    }
  }

  const total = scenarios.reduce((sum, s) => sum + s.weight, 0);
  return { score, total, results };
}

// ─── Output ──────────────────────────────────────────────────────────

const { score, total, results } = runEval();
const percentage = Math.round((score / total) * 100);

console.log('\n🦐 EDD Eval: Lot Suffix Rules');
console.log('═'.repeat(50));
results.forEach((r) => console.log(r));
console.log('═'.repeat(50));
console.log(`Score: ${score.toFixed(2)} / ${total.toFixed(2)} (${percentage}%)`);
console.log(percentage === 100 ? '🎉 ALL PASS' : '⚠️  SOME FAILURES');
console.log('');

// Exit with error code if not 100%
process.exit(percentage === 100 ? 0 : 1);
