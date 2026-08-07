# INATrace Frontend: Agent Context
> **Location:** `/fe` Workspace
> **Objective:** Source of Truth for Architectural constraints, SDD integration, and AI-Agent rules within the Angular Frontend ecosystem.

## 1. Project Architecture
- **Framework**: Angular 19
- **Monorepo System**: Utiliza **Nx** (`npx nx serve inatrace-fe`).
- **Module Federation (MFE)**: El frontend sigue una arquitectura distribuida (Host con remotos). El antiguo módulo camaronero fue recableado y extraído en su propio MFE (`shrimpMfe`) durante la migración de Angular 19.
- **Autenticación**: **Keycloak SSO** (OAuth2/OIDC) mediante `keycloak-angular`. Los validadores de token legacy fueron sustituidos en su totalidad.

## 2. API & Data Contracts
El Frontend no redacta manualmente sus modelos que mapean al backend. Utiliza **Swagger Codegen** para garantizar la paridad del esquema (TypeScript AST compliancy):
- **Script Autogenerador**: `./generate-api.js` intercepta el puerto del backend (Ej: `:8080/v3/api-docs`) para descargar todo el esquema actualizado a la carpeta `apps/inatrace-fe/src/api/`.
- **Regla Estricta**: Si el backend sufre un cambio de campos (Ej. nuevos atributos de Cacao), el orquestador **siempre** debe correr `generate-api.js` con el backend encendido localmente (o parchear meticulosamente las interfaces en caso extremo), antes de intentar renderizar en el HTML.

## 3. Product Domains & Forms (Cacao Migration)
### Reglas "Cacao Premium" Vigentes
Todo elemento del antiguo flujo lógico de "Shrimp" (Camarones) ha sido completamente mitigado de la aplicación base. El enfoque actual está regido por los procesos de acopio de **Cacao para Fortaleza del Valle**:
1. **Modelos Predictivos (UI-Calc Mode)**: En componentes clave de formularios (como `stock-delivery-details`), la UI está obligada a proveer feedback predictivo instantáneo al agricultor. 
   - **Fórmula UI Válida**: `Weight (Net) = (Gross - Tare) * (Moisture% / 100)`.  
   - Se procesa localmente en los hooks como `setToBePaid()`.
2. **Validaciones Numéricas**: Se emplean FormArrays explícitos de Angular (`validation.ts`) controlando fronteras lógicas (`[Validators.min(0), Validators.max(100)]` para variables como la humedad del grano).
3. Todo campo vital de Cacao (Variedad, Semana, Humedad, Parcela) opera mediante `ReactiveForms`.

## 4. Spec-Driven Development (SDD)
El proyecto ha transicionado activamente bajo metodologías **SDD**.
- **Archivo Log**: `openspec/changes/archive/` consolida todo el razonamiento, exploraciones y propuestas históricas de arquitecturas (Ej: migración al fronentend de cacao).
- Si alteras drásticamente flujos de pantalla, validaciones, u obtención de endpoints de la cadena de bloque, es ineludible seguir el flujo `Explore → Propose → Design → Tasks → Verify` documentando los hallazgos en la sub-carpeta `openspec`.

## 5. Development Workflow Guidelines
- **Modificación de Código**: No edites `package.json` a menos de tratar incompatibilidades estrictas del Angular 19 Toolkit.
- Antes de consolidar integraciones, asegúrate que `nx test` pase los Unit Tests locales, puntualmente en flujos aislados Keycloak u operaciones MFE.
- Los "Codebooks" operan como vocabularios dinámicos asíncronos controlados desde Base de Datos (Ej: `CertificationType`); el Front debe inyectarlos bajo listas selectivas e inyecciones de `CodebookTranslations`.

## 6. Catálogos administrables (`settings/type-list` + `type-detail-modal`) — trampas conocidas

> Extraído en vivo el 2026-07-29 al portar la administración de
> `CertificationType` desde una rama vieja (`develop`, estructura pre-Nx) a
> `staging`. Ver también `backend/agent-context.md` sección "6bis" — la
> mayoría de estos bugs son mitad-frontend mitad-backend, revisar ambos lados
> juntos, no solo el que muestra el síntoma.

- **El nombre del campo en el form NO siempre coincide con lo que "se ve" en
  otro tipo ya existente usado como plantilla.** Antes de bindear
  `form.get('label')` (u otro nombre) en un tipo nuevo, abrí el modelo real
  en `apps/inatrace-fe/src/api/model/apiXxx.ts` y confirmá el nombre exacto
  del campo generado — `CertificationType` usa `name`, no `label`, pese a que
  el resto de tipos parecidos (facility-types, measurement-unit-types) sí
  usan `label`. Si el campo no existe en el `FormGroup` (porque
  `generateFormFromMetadata` solo crea controles para los campos que
  `formMetadata()` define), el `<textinput>` no revienta ni marca error: solo
  se queda mudo, sin mostrar ni guardar nada, y es fácil no notarlo.

- **Comparaciones de texto contra catálogos editables desde un admin (no
  contra un enum fijo en código) deben normalizar tildes/diacríticos.** El
  dato lo puede editar cualquier usuario desde la pantalla de administración
  — no asumas que "Transición" siempre se escribe así; comparar contra el
  literal `'transicion'` (sin tilde) falla en JS porque no hay normalización
  automática de Unicode (`'transición'.includes('transicion')` es `false`).
  Ver `stripAccents()` en `stock-delivery-details.component.ts` como patrón
  a reutilizar — **no** escribas a mano en el código fuente los puntos de
  código Unicode de diacríticos combinantes (el bloque "Combining Diacritical
  Marks", U+0300 a U+036F): al escribirlos, copiarlos o pegarlos, un editor
  o herramienta puede insertar los caracteres combinantes reales en el
  archivo en vez de preservar una secuencia de escape de texto plano,
  corrompiendo la regex en silencio (sin error de compilación — hace falta
  revisar con `xxd`/hexdump para notarlo). Preferí un reemplazo explícito de
  vocales acentuadas precompuestas (`á`, `é`, `í`,
  `ó`, `ú`, `ñ`), que son caracteres normales de un solo code point.

- **Que el guardado no tire error 500/405 no significa que la UI lo haya
  detectado.** El flujo `save()` de `type-detail-modal.component.ts` decide
  cerrar el modal y refrescar la lista únicamente si `res.status === 'OK'`
  — si el backend responde con la entidad pelada en vez de un wrapper
  `ApiResponse`, el guardado queda persistido en la base pero el modal se
  queda abierto sin ningún aviso de error. Verificá con la pestaña Network
  (no solo "¿tiró excepción?") que la respuesta real tenga forma
  `{status: "OK", data: {...}}`.

## 7. Visibilidad del campo `parcelLot` (Lote/Parcela) — asimetría intencional entre Recepción y Procesamiento

> Extraído en vivo el 2026-08-05 tras una sesión de QA en `staging` contra
> Fortaleza del Valle (`testinatrace.espam.edu.ec`). Documentado porque **ya
> causó una regresión dentro de la misma sesión**: al "igualar" el
> comportamiento de los dos formularios se rompió lo que el usuario pidió,
> y hubo que revertir.

Existen **dos getters `shouldShowParcelLot` casi idénticos por nombre, pero
con reglas deliberadamente distintas** — no son el mismo control ni deberían
unificarse sin pedirlo explícitamente:

- **Recepción** —
  `stock-core/stock-delivery-details/stock-delivery-details.component.ts:204`
  → **siempre visible** (solo respeta el gate de tipo de producto de
  `ProductFieldVisibilityService`, ignora la config de empresa). Decisión de
  producto tomada el 2026-08-05.
- **Procesamiento** —
  `stock-processing/.../processing-order-output.component.ts:109` →
  **condicionado** por `companyProfile?.configuration?.enableParcelLot`
  (toggle por empresa, default `false`, editable en
  `company-detail.component.html` sección "Configuración de la empresa").

El toggle `enableParcelLot` en `company-detail` sigue existiendo en la UI y
**sí tiene efecto real en Procesamiento**, pero **no tiene ningún efecto en
Recepción** desde el 2026-08-05 (commit `632d3663` en `fe`, revertido
parcialmente en `0af6a99a` para restaurar solo Procesamiento). Antes de
"limpiar" esta asimetría por parecer inconsistente, o de copiar el patrón de
un formulario al otro asumiendo que deberían comportarse igual: **confirmar
con el usuario cuál es el alcance querido** — ya ocurrió una vez que un
cambio hecho "para ambos" tuvo que deshacerse en el mismo turno.

## 8. Despliegue y verificación en producción (Fortaleza)

> Extraído el 2026-08-07 durante el primer despliegue real a producción.
> Complementa `backend/agent-context.md` sección 11, que tiene el detalle de
> infraestructura. Leé ambas antes de tocar el pipeline.

### Cómo verificar que un cambio de UI realmente llegó

No alcanza con que el job de Jenkins diga `SUCCESS`. El contenedor de frontend
de producción sirve desde **`/app`**, no desde `/usr/share/nginx/html` (esa
ruta existe en el `nginx.conf` pero está vacía — buscar ahí da falso negativo):

```bash
docker exec inatrace-fe-prod-fortaleza sh -c "grep -oh 'TU_ETIQUETA' /app/*.js | sort | uniq -c"
```

Contar ocurrencias es más útil que buscar presencia: si cambiaste una etiqueta
en un solo formulario, el conteo esperado distingue "se desplegó bien" de
"se desplegó de más". Ejemplo real: tras renombrar la etiqueta solo en
Recepción, lo correcto es **1× `N° Parcela` + 3× `Lote (Parcela)`** (las tres
restantes son Procesamiento, exportación a PDF y el checkbox de configuración
de empresa, que se dejaron a propósito).

El micro-frontend de camarón se sirve desde `/app/shrimpMfe/` en el mismo
contenedor, aunque Fortaleza no lo use.

### Las imágenes rotas casi nunca son culpa del frontend

Un `500` en `/api/public/image/{storageKey}` es del backend: el archivo no
existe en disco. Los registros de `document` se migran con el `pg_dump`, pero
**los archivos subidos no** — ver `backend/agent-context.md` 11.5. Antes de
buscar el bug en Angular, mirá `docker logs inatrace-be | grep NoSuchFile`.

Ojo: el navegador puede pedir `storageKey` que **ya no existen en la tabla
`document`** (caché o registros borrados). Esos devuelven
`INVALID_REQUEST Invalid storage key or file type` y no se arreglan copiando
archivos.

### Un job en rojo no siempre es un bug del código

`Deploy-Frontend` corre el build de Angular dentro de Docker en el agente de
Jenkins, que vive en el servidor de **staging** y suele estar con `/var` al
límite. Si el log muestra `Resuming build ... after Jenkins restart` seguido de
`context canceled`, el build murió por el reinicio del servicio, no por el
código: relanzá el job en vez de investigar el diff.


## 9. Pérdida de datos por logout automático de Keycloak (2026-08-07)

> Diagnóstico completo de un caso real en producción: los usuarios cargaban una
> Recepción, se distraían un minuto y **el formulario se borraba solo**.
> Documentado con la cadena causal entera porque los síntomas apuntaban a
> lugares equivocados (cookies, i18n, polling) y se descartaron uno por uno.

### La cadena

1. Keycloak invalida la sesión de cliente (en prod, por un `Client Session Max`
   de **60 segundos** en el realm `inatrace_fortaleza`).
2. keycloak-js dispara `TokenExpired` → `AutoRefreshTokenService.processTokenExpiredEvent()`
   → `keycloak.updateToken()`.
3. El `POST /auth/realms/<realm>/protocol/openid-connect/token` responde **400**.
4. keycloak-angular ejecuta `updateToken().catch(() => executeOnInactivityTimeout())`
   y su default es **`'logout'`**.
5. `logout()` → `localStorage.clear()` + redirect → recarga completa, formulario perdido.

### Reglas para no reintroducirlo

- **`withAutoRefreshToken` sin `onInactivityTimeout` explícito es peligroso.**
  El default `'logout'` convierte cualquier fallo transitorio de refresco en
  pérdida de datos del usuario. En `shared/auth/src/lib/auth.provider.ts` está
  fijado en `'none'` a propósito: **no lo quites ni lo "simplifiques"**.

- **El interceptor amplifica el problema.** `core/token.interceptor.ts` llama
  `auth.logout()` ante *cualquier* 401 que no sea `/login`, `/logout` o
  `/user/profile` en rutas ignoradas. No distingue "sesión vencida" de "esta
  petición puntual falló". Si tocás manejo de errores HTTP, tenelo presente.

- **Un "se refresca solo" casi nunca es un `setInterval`.** Antes de buscar
  timers, mirá en DevTools → Network (con *Preserve log*) si hay un `POST` al
  endpoint `/token` con 400/401 justo antes del refresco. La pista definitiva
  está en el stack: `processTokenExpiredEvent → updateToken`.

- **Los tiempos de sesión viven en Keycloak, no en el código.** Consultables sin
  la consola web:
  ```sql
  SELECT name, value FROM realm_attribute
   WHERE realm_id=(SELECT id FROM realm WHERE name='<realm>')
     AND name LIKE 'clientSession%';
  SELECT access_token_lifespan, sso_idle_timeout, sso_max_lifespan
    FROM realm WHERE name='<realm>';
  ```
  Ojo: `clientSessionMaxLifespan` en **segundos**; `0` significa heredar
  `sso_max_lifespan`. Un valor bajo ahí rompe la app aunque el código esté bien.
  Keycloak cachea la config del realm en memoria: cambiarla por `UPDATE` directo
  **no aplica** sin reiniciar el contenedor — usar la Admin Console.

