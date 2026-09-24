import { Rf01Settlement, Rf01LocalInputs } from '../utils/rf01-settlement.util';

/**
 * EVAL: RF01 Settlement Oracle (Empacadora DUFER)
 *
 * Verifica que la liquidación reproduzca el proceso físico descrito en `giz/2026/RF01.md`,
 * confirmado por el dueño de producto. Caso dorado: lote 504.
 *
 * Contratos cubiertos (`inatrace-agent-rules/knowledge/shrimp-okf-spec.md`):
 *   OKF-06  Peso Recibido POR PROCESO (entero reconstruido / cola pesada)
 *   OKF-07  Peso Procesado = lo clasificado, no "recibido − basura − remanente"
 *   OKF-08  Un rendimiento por proceso
 *   OKF-09  Aislamiento de proceso: basura y rendimiento nunca cruzan entero↔cola,
 *           y la cola entra por DOS caminos (rechazo descabezado / directa de camaronera)
 *
 * A diferencia de los evals antiguos basados en `console.assert` (que sólo loguean), éste
 * falla con exit code 1 para poder usarse como gate de CI.
 */

let failures = 0;
let checks = 0;

function check(label: string, actual: unknown, expected: unknown): void {
  checks++;
  const ok = actual === expected;
  if (!ok) {
    failures++;
    console.error(`  ❌ ${label}\n       esperado: ${expected}\n       obtenido: ${actual}`);
  } else {
    console.log(`  ✅ ${label} = ${actual}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCENARIO 1 — RF01 lote 504: entero con rechazo que alimenta la línea de cola
// ─────────────────────────────────────────────────────────────────────────────
// RF01 §2: Clase A 2481.5 lb · Rechazo 995 lb · Basura 3 lb
// RF01 §3: Recibidas = 2481.5 + 995 + 3 = 3479.5 · Netas = 3476.5
// RF01 §4: Rendimiento = 2481.5 / 3476.5 = 71.37 %
// RF01 cola §1-§4: Recibidas 995 (pesadas) · Basura 3 · Netas 992
//                  Procesadas = 516 + 135 + 16.40 = 667.4 · Rendimiento = 67.27 %
function evalLote504(): void {
  console.log('\n🦐 ESCENARIO 1 — RF01 lote 504 (entero → rechazo → cola)');

  const inputs: Rf01LocalInputs = {
    classifiedEnteroLbs: 2481.5,
    classifiedColaLbs: 516 + 135 + 16.4,
    rejectedLbs: 995,
    enteroWasteLbs: 3,
    colaWasteLbs: 3, // basura PROPIA del descabezado, independiente de la de entero
    colaRemnanteLbs: 0,
    receptionIsCola: false,
    receptionTotalWeightLbs: 3500, // ticket de finca, referencial
  };

  const entero = Rf01Settlement.reconstructEntero(inputs);
  console.log('  — Proceso con cabeza (RF01 §2-§4)');
  check('entero.aplicable', entero.applicable, true);
  check('entero.brutoReconstruido', entero.grossReceivedReconstructed, true);
  check('entero.procesadas', entero.processedLbs, 2481.5);
  check('entero.rechazo', entero.rejectedLbs, 995);
  check('entero.basura', entero.wasteLbs, 3);
  check('entero.librasRecibidas', entero.grossReceivedLbs, 3479.5);
  check('entero.librasNetasRecibidas', entero.netReceivedLbs, 3476.5);
  check('entero.rendimiento ≈ 71.37 % (RF01 trunca)', entero.yieldPercent, 71.38);

  const cola = Rf01Settlement.reconstructCola(inputs);
  console.log('  — Proceso en cola (RF01 §1-§4)');
  check('cola.aplicable', cola.applicable, true);
  check('cola.brutoPesadoNoReconstruido', cola.grossReceivedReconstructed, false);
  check('cola.librasRecibidas (= rechazo del entero)', cola.grossReceivedLbs, 995);
  check('cola.basura propia (NO 6)', cola.wasteLbs, 3);
  check('cola.librasNetasRecibidas', cola.netReceivedLbs, 992);
  check('cola.procesadas (A+B+C)', cola.processedLbs, 667.4);
  check('cola.rendimiento ≈ 67.27 % (RF01 trunca)', cola.yieldPercent, 67.28);

  console.log('  — Aislamiento de proceso (OKF-09)');
  check('basura NO compartida entre hojas', entero.wasteLbs === cola.wasteLbs && entero.wasteLbs === 6, false);
  check('rendimientos distintos por proceso', entero.yieldPercent === cola.yieldPercent, false);

  console.log('  — Hojas PDF');
  const hojaEntero = Rf01Settlement.toEnteroSheet(entero);
  const hojaCola = Rf01Settlement.toColaSheet(cola);
  check('hojaEntero.basura', hojaEntero.basura, 3);
  check('hojaCola.basura', hojaCola.basura, 3);
  check('hojaEntero.rechazo (cola recuperada)', hojaEntero.rechazo, 995);
  check('hojaCola.rechazo en blanco (pertenece a entero)', hojaCola.rechazo, '');
  check('hojaCola.pesoPlanta = pesaje al ingreso', hojaCola.pesoPlanta, 995);
  check('hojaEntero.remanente en blanco (entero no captura)', hojaEntero.remanente, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCENARIO 2 — Cola directa desde camaronera (RF01 §1, segundo camino de entrada)
// ─────────────────────────────────────────────────────────────────────────────
// El lote NO pasó por la línea de entero: no hay hoja con cabeza, y el bruto de cola es el
// pesaje obligatorio de recepción, no un rechazo. Regresión histórica: todo el producto se
// archivaba bajo el proceso con cabeza porque los lotes no llevan sufijo "-COLA".
function evalColaDirecta(): void {
  console.log('\n🦐 ESCENARIO 2 — Cola directa desde camaronera');

  const inputs: Rf01LocalInputs = {
    classifiedEnteroLbs: 0,
    classifiedColaLbs: 700,
    rejectedLbs: 0,
    enteroWasteLbs: 0,
    colaWasteLbs: 8,
    colaRemnanteLbs: 0,
    receptionIsCola: true,
    receptionTotalWeightLbs: 1000, // pesaje obligatorio al ingreso
  };

  const entero = Rf01Settlement.reconstructEntero(inputs);
  const cola = Rf01Settlement.reconstructCola(inputs);

  check('entero NO aplica (el lote nunca pasó por esa línea)', entero.applicable, false);
  check('cola.librasRecibidas = pesaje de recepción', cola.grossReceivedLbs, 1000);
  check('cola.librasNetasRecibidas', cola.netReceivedLbs, 992);
  check('cola.procesadas', cola.processedLbs, 700);
  check('cola.rendimiento', cola.yieldPercent, 70.56);
  check('producto NO archivado bajo entero', entero.processedLbs, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCENARIO 3 — Entero sin etapa de cola (todo el lote salió exportable)
// ─────────────────────────────────────────────────────────────────────────────
function evalEnteroSinCola(): void {
  console.log('\n🦐 ESCENARIO 3 — Entero sin rechazo (sin línea de cola)');

  const inputs: Rf01LocalInputs = {
    classifiedEnteroLbs: 1200,
    classifiedColaLbs: 0,
    rejectedLbs: 0,
    enteroWasteLbs: 5,
    colaWasteLbs: 0,
    colaRemnanteLbs: 0,
    receptionIsCola: false,
    receptionTotalWeightLbs: 1250,
  };

  const entero = Rf01Settlement.reconstructEntero(inputs);
  const cola = Rf01Settlement.reconstructCola(inputs);

  check('entero.librasRecibidas', entero.grossReceivedLbs, 1205);
  check('entero.librasNetasRecibidas', entero.netReceivedLbs, 1200);
  check('entero.rendimiento 100 % (todo exportable)', entero.yieldPercent, 100);
  check('cola NO aplica (no hubo rechazo)', cola.applicable, false);
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCENARIO 4 — El remanente NO altera las fórmulas de RF01
// ─────────────────────────────────────────────────────────────────────────────
// RF01 §3.2 cuenta los sobrantes DENTRO de la Clase B, así que el remanente no se suma al
// recibido ni se resta de las netas. Si alguien lo vuelve a meter en las fórmulas, este
// escenario lo detecta.
function evalRemanenteNoAlteraFormulas(): void {
  console.log('\n🦐 ESCENARIO 4 — Remanente es informativo, no entra en las fórmulas');

  const base: Rf01LocalInputs = {
    classifiedEnteroLbs: 0,
    classifiedColaLbs: 667.4,
    rejectedLbs: 0,
    enteroWasteLbs: 0,
    colaWasteLbs: 3,
    colaRemnanteLbs: 0,
    receptionIsCola: true,
    receptionTotalWeightLbs: 995,
  };
  const conRemanente: Rf01LocalInputs = { ...base, colaRemnanteLbs: 40 };

  const sin = Rf01Settlement.reconstructCola(base);
  const con = Rf01Settlement.reconstructCola(conRemanente);

  check('netas iguales con y sin remanente', con.netReceivedLbs, sin.netReceivedLbs);
  check('procesadas iguales con y sin remanente', con.processedLbs, sin.processedLbs);
  check('rendimiento igual con y sin remanente', con.yieldPercent, sin.yieldPercent);
  check('remanente se reporta como informativo', con.remnanteLbs, 40);
}

// ─────────────────────────────────────────────────────────────────────────────
function run(): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' RF01 SETTLEMENT ORACLE — Liquidación por proceso (DUFER)');
  console.log('═══════════════════════════════════════════════════════════════');

  evalLote504();
  evalColaDirecta();
  evalEnteroSinCola();
  evalRemanenteNoAlteraFormulas();

  console.log('\n───────────────────────────────────────────────────────────────');
  if (failures > 0) {
    console.error(`❌ RF01 SETTLEMENT ORACLE: ${failures}/${checks} verificaciones FALLARON.`);
    console.error('   La liquidación ya no reproduce el proceso físico de RF01.');
    process.exit(1);
  }
  console.log(`✅ RF01 SETTLEMENT ORACLE: ${checks}/${checks} verificaciones pasaron.`);
}

run();
