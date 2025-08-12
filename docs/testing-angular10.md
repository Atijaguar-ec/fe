# Testing en Angular 10 con Node.js 14

## Introducción
Este documento describe la configuración, buenas prácticas y comandos para ejecutar y mantener pruebas unitarias en el proyecto INATrace Frontend, que utiliza Angular 10 y Node.js 14.

---

## 1. Dependencias y Entorno

- **Angular:** 10.x
- **Node.js:** 14.x
- **Herramientas de testing:** Karma, Jasmine
- **Runner:** Chrome Headless

Las versiones de todas las dependencias de Angular y testing están fijadas en el `package.json` para asegurar compatibilidad y estabilidad.

---

## 2. Configuración de Testing

### Scripts en `package.json`
```json
"scripts": {
  "test": "ng test",
  "lint": "ng lint"
}
```

### Configuración en `angular.json`
- El bloque `architect.test` usa el builder:
  ```json
  "builder": "@angular-devkit/build-angular:karma"
  ```

### Archivo `karma.conf.js`
- Usa Jasmine y Karma con plugins estándar para Angular 10.
- Ejecuta los tests en Chrome.

---

## 3. Estructura de Archivos de Test
- Los archivos de test deben tener el sufijo `.spec.ts`.
- Ubicación estándar: junto al archivo fuente correspondiente en `src/app/`.

Ejemplo:
- `src/app/app.component.ts`
- `src/app/app.component.spec.ts`

---

## 4. Ejecución de Tests

### Local
```bash
npm run test
```
Esto ejecuta todos los tests en modo interactivo usando Karma y Chrome.

### CI/CD
El workflow de GitHub Actions (`.github/workflows/deploy-frontend.yml`) ejecuta automáticamente los tests en cada push a `main` o `develop`:
```yaml
- name: Run tests
  run: npm run test -- --watch=false --browsers=ChromeHeadless
```

---

## 5. Buenas Prácticas
- Mantener los tests actualizados y relevantes.
- No eliminar el paso de tests del pipeline de CI/CD salvo casos excepcionales.
- Corregir o deshabilitar temporalmente tests problemáticos, pero restaurarlos lo antes posible.
- Usar solo sintaxis y dependencias compatibles con Angular 10 y Node.js 14.

---

## 6. Troubleshooting
- Si los tests fallan por incompatibilidad de dependencias, revisar y restaurar versiones en `package.json`.
- Si Karma o Jasmine no ejecutan los tests, revisar la configuración en `karma.conf.js` y `angular.json`.

---

## 7. Recursos
- [Testing Angular](https://angular.io/guide/testing)
- [Karma Runner](https://karma-runner.github.io/)
- [Jasmine](https://jasmine.github.io/)

---

**Mantén este documento actualizado si se migra a una versión superior de Angular o Node.js, o si se cambia la infraestructura de testing.**
