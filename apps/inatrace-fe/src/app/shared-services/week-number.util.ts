/**
 * Numeracion de semanas por empresa. Espejo de WeekNumberTools.java en el backend:
 * si cambias la regla aca, cambiala alla tambien, porque el backend recalcula el
 * numero al guardar y su valor es el que queda persistido.
 *
 * El esquema sale de company.configuration.weekNumberingScheme. Sin la clave se usa
 * ISO-8601, que es lo que ven todas las empresas menos Fortaleza.
 */

export type WeekNumberingScheme = 'ISO' | 'FIRST_MONDAY';

export const WEEK_NUMBERING_SCHEME_KEY = 'weekNumberingScheme';

export const WEEK_COLOR_CODES_KEY = 'weekColorCodes';

export interface WeekColor {
  name: string;
  hex: string;
  /** El blanco necesita borde para verse sobre fondo claro. */
  needsBorder: boolean;
}

/**
 * Ciclo de 5 colores de Fortaleza. El color depende solo del numero de semana, por eso
 * cada año vuelve a empezar en ROJO (la semana 52 es AZUL y la 1 siguiente ROJO).
 */
const WEEK_COLORS: WeekColor[] = [
  { name: 'ROJO', hex: '#FF0000', needsBorder: false },
  { name: 'AZUL', hex: '#0070C0', needsBorder: false },
  { name: 'BLANCO', hex: '#FFFFFF', needsBorder: true },
  { name: 'VERDE', hex: '#00B050', needsBorder: false },
  { name: 'AMARILLO', hex: '#FFFF00', needsBorder: false },
];

export function weekNumberingSchemeOf(configuration: { [key: string]: any }): WeekNumberingScheme {
  return configuration?.[WEEK_NUMBERING_SCHEME_KEY] === 'FIRST_MONDAY' ? 'FIRST_MONDAY' : 'ISO';
}

export function weekColorCodesEnabled(configuration: { [key: string]: any }): boolean {
  return !!configuration?.[WEEK_COLOR_CODES_KEY];
}

/**
 * Color de la semana, o null si el numero esta fuera de rango.
 */
export function weekColor(weekNumber: number): WeekColor | null {
  if (!weekNumber || weekNumber < 1) {
    return null;
  }
  return WEEK_COLORS[(weekNumber - 1) % WEEK_COLORS.length];
}

/**
 * Numero de semana de la fecha segun el esquema, o null si el esquema no le asigna
 * ninguno (sabado o domingo con FIRST_MONDAY: no se trabaja, se escribe a mano).
 */
export function calculateWeekNumber(dateInput: any, scheme: WeekNumberingScheme): number | null {

  const d = parseLocalDate(dateInput);
  if (!d) {
    return null;
  }

  return scheme === 'FIRST_MONDAY' ? firstMondayWeekNumber(d) : isoWeekNumber(d);
}

/**
 * 'new Date("YYYY-MM-DD")' interpreta la cadena como medianoche UTC, pero los metodos
 * de abajo trabajan en hora local. En husos negativos (Ecuador, UTC-5) eso corre la
 * fecha un dia atras y puede cambiar la semana en el limite. Por eso se parsean los
 * componentes Y-M-D directo a una fecha local.
 */
function parseLocalDate(dateInput: any): Date | null {

  if (!dateInput) {
    return null;
  }

  let d: Date;
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    d = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(dateInput);
  } else {
    d = new Date(dateInput);
  }

  if (isNaN(d.getTime())) {
    return null;
  }

  d.setHours(0, 0, 0, 0);
  return d;
}

function isoWeekNumber(date: Date): number {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function firstMondayWeekNumber(date: Date): number | null {

  const day = date.getDay();
  if (day === 0 || day === 6) {
    return null;
  }

  // Los dias anteriores al primer lunes del año pertenecen a la ultima semana del año
  // anterior: el 1 de enero de 2027 (viernes) es la semana 52 de 2026.
  let anchor = firstMondayOfYear(date.getFullYear());
  if (date.getTime() < anchor.getTime()) {
    anchor = firstMondayOfYear(date.getFullYear() - 1);
  }

  const days = Math.round((date.getTime() - anchor.getTime()) / 86400000);
  return Math.floor(days / 7) + 1;
}

function firstMondayOfYear(year: number): Date {
  const jan1 = new Date(year, 0, 1);
  jan1.setHours(0, 0, 0, 0);
  // getDay(): 0 domingo ... 1 lunes. Dias que faltan hasta el primer lunes.
  const offset = (8 - (jan1.getDay() || 7)) % 7;
  jan1.setDate(jan1.getDate() + offset);
  return jan1;
}
