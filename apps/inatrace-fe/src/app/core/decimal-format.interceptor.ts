import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { parseDecimal } from '../../shared/utils';

/**
 * Convierte a número los decimales escritos con coma ("109,1", "1.234,56") en el
 * cuerpo de las peticiones, porque el backend (Jackson) rechaza esos textos en
 * campos BigDecimal. Es la red de seguridad para formularios que no pasan sus
 * cantidades por parseDecimal antes de enviar.
 *
 * Dos límites deliberados (ver agent-context.md §15):
 * - Solo recorre objetos planos y arreglos. Un Date, Blob u otra instancia de
 *   clase se deja intacta: copiarla con spread la convierte en {} y la fecha
 *   llega vacía al backend (el datepicker escribe Date en los formularios).
 * - Solo convierte campos cuyo nombre es numérico. Un texto libre que casualmente
 *   sea "12,5" (comentario, nombre de parcela, lote) no debe volverse número.
 */
const NUMERIC_KEY =
  /(quantity|price|tare|deduction|discount|percentage|weight|cost|amount|paid|balance|estimate|latitude|longitude|rate$|factor$|^size$|^sacNumber$|cultivatedArea|areaOrganicCertified)/i;

const COMMA_DECIMAL = /^-?\d+(?:\.\d{3})*,\d+$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function sanitizeDecimals(data: unknown, key?: string): unknown {
  if (typeof data === 'string') {
    if (key && NUMERIC_KEY.test(key) && COMMA_DECIMAL.test(data.trim())) {
      const parsed = parseDecimal(data);
      return parsed ?? data;
    }
    return data;
  }
  if (Array.isArray(data)) {
    // Los elementos heredan el nombre del campo: amounts: ["1,5"] sigue siendo numérico
    return data.map((item) => sanitizeDecimals(item, key));
  }
  if (isPlainObject(data)) {
    const copy: Record<string, unknown> = {};
    for (const k of Object.keys(data)) {
      copy[k] = sanitizeDecimals(data[k], k);
    }
    return copy;
  }
  return data;
}

@Injectable()
export class DecimalFormatInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (Array.isArray(request.body) || isPlainObject(request.body)) {
      return next.handle(
        request.clone({ body: sanitizeDecimals(request.body) }),
      );
    }
    return next.handle(request);
  }
}
