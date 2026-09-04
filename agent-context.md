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


---

## 10. `single-choice` + `EnumSifrant`: un valor fuera del catálogo se muestra VACÍO

> Extraído el 2026-08-14 en una revisión QA. **Regresión real introducida y
> corregida en la misma sesión** — es la trampa más fácil de reintroducir de
> todo el frontend.

### 10.1 El mecanismo

`EnumSifrant.isEnumFormControl()` devuelve **`true`**. En esa rama,
`single-choice` no muestra el valor del form control tal cual: lo resuelve con

```ts
enumValueToObject(val, options) {
  let res = enumOptions.find(x => x.id === val);
  if (!res) return null;   // ← el valor desaparece de la vista
  ...
}
```

Si el valor guardado **no está entre las opciones del codebook**, el combo se
ve vacío. El dato no se pierde (el `FormControl` lo conserva y se envía al
guardar), pero **el usuario no lo ve**, que es igual de grave.

> Contraste importante: los codebooks que **no** son `EnumSifrant` (p. ej.
> `CompanyUserCustomersByRoleService`) caen en la rama
> `this.modelChoice = this.formControlInput.value`, que **sí** muestra el valor
> aunque no esté en la lista. Por eso filtrar agricultores suspendidos del
> selector de Recepción es seguro, pero cambiar un catálogo `EnumSifrant` no.

### 10.2 Caso concreto que ocurrió

La config de empresa `numericVarietyOptions` (solo UNOCACE) hace que Entregas
guarde la variedad como `"1"`/`"2"` en vez de `NACIONAL`/`CCN51`. Procesamiento
**propaga** ese valor desde las entregas de entrada
(`stock-processing-order-details.component.ts` → `variety.setValue(ref.variety)`),
pero su combo tenía el catálogo **hardcodeado**:

```ts
varietyOptions = EnumSifrant.fromObject({ NACIONAL: 'Nacional', CCN51: 'CCN51' });
```

Resultado: variedad en blanco en Procesamiento para UNOCACE.

### 10.3 Reglas

1. Si cambiás el **vocabulario de valores** de un campo, buscá **todas** las
   pantallas que lo renderizan, no solo la que editás:
   ```bash
   grep -rn "\.variety\b" apps/inatrace-fe/src/app/
   ```
   Para `variety` son cinco lugares: Entregas, Procesamiento (output **e**
   input, este último lo muestra como texto junto al lote), `batch-history` y
   `pdf-generator.service`.
2. Las pantallas que muestran el valor como **texto crudo** (`{{ stockOrder.variety }}`
   en `batch-history`, el PDF) **no traducen nada**. Por eso el valor guardado
   para `numericVarietyOptions` es literalmente `"1"`/`"2"` y no un id interno:
   si se guardara `ORGANICO`, esas pantallas mostrarían `ORGANICO`.
3. Un catálogo que depende de config de empresa **no puede inicializarse en la
   declaración del campo** — ahí `companyProfile` todavía es `undefined`. Va en
   `ngOnInit` (si es `@Input`) o después de resolver el perfil (en Entregas se
   rehace dentro de `reloadOrder()`).

---

## 11. Estado del productor (`status`) — qué NO tocar

> Agregado el 2026-08-14 junto con la feature.

- **El filtro es opt-in, no por defecto.** El endpoint
  `/userCustomers/{companyId}/{type}` devuelve **todos** los estados salvo que
  se pida `onlyAvailableForTransactions=true` (o `status=X`). Es intencional:
  el listado administrativo tiene que seguir viendo suspendidos y retirados
  para poder reactivarlos.
- **Dónde SÍ se filtra:** Recepción y Recepción masiva
  (`new CompanyUserCustomersByRoleService(..., 'FARMER', true)`).
- **Dónde NO, a propósito:** Pagos y dashboard. Liquidar lo ya devengado a un
  agricultor retirado y consultar históricos **no** son transacciones nuevas.
  Decisión de producto del 2026-08-14 — si se cambia, es pasando `true` en las
  tres instanciaciones de `stock-payments-*`, pero **preguntá antes**.
- **El validador `required` de `status` está en el esquema compartido**
  (`company-collectors-details/validation.ts`, usado por agricultores **y**
  acopiadores). Por eso la ficha de acopiador **también** expone el campo: sin
  eso, marcar `required` rompe el alta de acopiadores. No quites el campo de una
  de las dos pantallas sin ajustar el esquema.

---

## 12. `parcelLot` en Entregas: combo de las parcelas del agricultor

> Agregado el 2026-08-14. **Reescrito el 2026-09-04**: hasta esa fecha el combo
> ofrecía `Parcela 1..N` posicionales y guardaba la posición. Si leés código o
> datos de antes, esa era la semántica. Complementa la §7 (asimetría
> Recepción/Procesamiento), que **sigue vigente**.

En **Recepción** no es texto libre: es un `single-choice` poblado con las
parcelas del agricultor seleccionado (`getUserCustomer(farmerId).plots`). Se
recalcula en `setFarmer()` y en `editStockOrder()`.

**Qué se guarda**: el `plotName` con el que la parcela está registrada en la
ficha del agricultor ("Lote 7"). Las parcelas **sin nombre** caen en su posición
(`"1"`, `"2"`…), que es lo que se guardaba antes del 2026-09-04 — así el dato
histórico y el Excel de exportación, que vuelca este campo tal cual, no cambian
de forma. `parcel_lot` es una columna `String` **sin clave foránea**: nadie la
resuelve nunca a una parcela del lado servidor.

**La entrega hereda de la parcela** la variedad y el tipo de certificación
(`applyPlotDefaults()`), que ya estaban cargados en su ficha. Tres cosas que hay
que preservar si tocás eso:

- La herencia corre **solo al elegir parcela**, vía el listener de `valueChanges`
  que se registra en `setupFormListeners()`. Al cargar una entrega ya guardada
  ese listener todavía no existe (los datos se vuelcan antes), y esa es la única
  razón por la que abrir una entrega vieja **no le pisa** la variedad y la
  certificación con los datos de hoy de la parcela. Si movés el registro del
  listener antes del volcado, rompés el histórico en silencio.
- **La variedad se fija antes que la certificación.** Fijarla dispara la regla
  existente que con CCN51 autocompleta la certificación de transición; el orden
  es lo que hace que gane la certificación de la parcela.
- La certificación se hereda **solo si está entre las opciones vigentes** del
  combo, que se filtran según si la entrega es orgánica
  (`certificationTypeFilteredMap`). Poner una que quedó fuera del filtro dejaría
  el combo mostrando un valor no elegible (§10).

**Vocabularios distintos, y esto está sin confirmar con el cliente**: la parcela
guarda `cocoaVariety` como `ORGANICO | CCN51`; la entrega guarda `NACIONAL |
CCN51`, o `"1" | "2"` con `numericVarietyOptions`. `varietyValueFromPlot()` asume
que **ORGANICO y NACIONAL son la misma casilla con distinto nombre**. La mitad
numérica sí está respaldada por el código (`initializeVarietyOptions` documenta
1 = Orgánico); la equivalencia con "Nacional" es inferencia. Si resulta falsa, es
una línea.

**Preselección**: al elegir agricultor se preselecciona la parcela **solo si
tiene una sola**. Con dos o más el campo queda vacío a propósito — elegir por el
usuario no sería solo poner un número, arrastraría variedad y certificación de
una parcela que nadie eligió.

Dos cosas más que hay que preservar al tocarlo:

1. **Al editar una entrega vieja, el valor guardado se conserva como opción
   aunque exceda las parcelas actuales** del agricultor (parcela borrada
   después). Ver `refreshParcelLotOptions(farmerId, existingValue)`: con
   `existingValue` nunca limpia el control. Sin esa salvaguarda, y por el
   mecanismo de §10.1, editar una entrega antigua **borraría el dato en
   silencio**.
2. **En Procesamiento sigue siendo `textinput`**, y está bien: ahí el valor se
   **propaga automáticamente** desde las entregas de entrada, no lo elige el
   usuario contra un agricultor. No "unifiques" los dos formularios.

### 12.1 Regla de negocio: sin parcela no se vende

Decisión de producto del 2026-08-14: **un agricultor sin parcelas registradas no
puede vender cacao.** Se implementa así, y no de otra forma:

- N° Parcela es **`Validators.required`** cuando el campo se muestra y el tipo de
  orden es `PURCHASE_ORDER` (ver `updateParcelLotValidator()`). Si el agricultor
  no tiene parcelas, el combo queda vacío → no hay nada que elegir → la entrega
  no se puede guardar.
- **Excepción desde 2026-09-04**: con `parcelLotFreeText` (§14) el campo vuelve a
  ser una caja de texto y esta regla **no aplica**, porque no hay parcelas contra
  las cuales validar. Es para las empresas que no las llevan registradas en el
  sistema; sin esa salida, el combo vacío les impide registrar cualquier entrega.
  Ahí el patrón de solo dígitos sí se aplica; en el combo no, porque el valor es
  el nombre de la parcela.
- El agricultor **sigue visible** en el selector, a propósito. Se evaluó
  ocultarlo y se descartó: el operador tiene que poder encontrarlo y entender
  por qué no puede venderle. El mensaje de error se lo dice y lo manda a
  cargarle la parcela.
- Aplica **solo donde el campo se muestra** (hoy cacao, vía
  `ProductFieldVisibilityService`). No extender a otros productos sin pedirlo:
  bloquearía flujos que hoy funcionan.

Contexto de datos al momento de implementarlo (UNOCACE staging): **581 de 979
agricultores no tenían ninguna parcela**, pero solo **1 de 636 recepciones**
existentes carecía de `parcelLot` — por eso volver el campo obligatorio no
rompe la edición del histórico. Si vas a tocar esta regla, **volvé a medir**
esas dos cifras antes.

---

## 13. Mapa de parcelas: Geo-ID de AgStack y modal de Whisp

> Extraído el **2026-08-31** tras dejar la cadena funcionando en staging de UNOCACE.
> El detalle del lado servidor está en `backend/agent-context.md` §14. Guía operativa:
> `ina-docs/operacion/analisis-deforestacion-whisp.md`.

### 13.1 Dónde vive cada cosa

| Archivo | Rol |
|---|---|
| `shared/map/map.component.ts` | Dibuja polígonos y marcadores; arma el globo con Geo-ID y botones |
| `company/company-common/plots-form/plots-form.component.ts` | Abre el modal (`openGeoIdWhisp`) |
| `company/company-farmers/open-plot-details-externally-modal/` | El modal: un `<iframe>` a `whisp.earthmap.org` |

### 13.2 El botón está en el marcador del centro, NO en el polígono

No hay ningún manejador de clic sobre el relleno del polígono: pulsarlo no hace nada, y
es intencional. El globo cuelga de un marcador que `setPlotCenterMarker()` coloca en el
**centroide** de la parcela. Los pines numerados que se ven al editar coordenadas se crean
con `placeMarkerOnMap(lat, lng)` **sin** el objeto `plot`, y por eso no tienen globo.

Si alguien reporta "hago clic en la parcela y no pasa nada", casi siempre está pulsando el
área o un vértice en vez del marcador central.

### 13.3 El globo se arma UNA sola vez — la trampa

`placeMarkerOnMap()` decide en tiempo de construcción, mirando `plot.geoId`:

- **Sin `geoId`** → botón *Actualizar*, y el listener llama a `refreshGeoId()`.
- **Con `geoId`** → texto del identificador + botón *Open in Whisp*, con su listener.

Las dos ramas son excluyentes y se resuelven al crear el marcador. **El botón de Whisp no
existe en el DOM** cuando la parcela llegó sin `geoId`.

Por eso, tras registrar un Geo-ID nuevo no basta con pintar el texto: hay que crear también
el botón de Whisp y engancharle el listener. Eso hace `showGeoIdInPopup()`. Antes de ese
arreglo (2026-08-31) el usuario veía el Geo-ID recién creado **sin nada que pulsar** hasta
recargar la página.

> **Regla:** cualquier cambio de estado que altere qué botones muestra el globo tiene que
> reconstruir el DOM del globo, no solo reemplazar un texto.

### 13.4 El modal no necesita credenciales

`OpenPlotDetailsExternallyModalComponent` arma una URL a
`https://whisp.earthmap.org/?aoi=WHISP&boundary&geoId=...` con tres capas preactivadas
(JRC forest mask, Cocoa ETH, Oil palm FDAP), vista satelital y el panel de estadísticas
abierto. **No usa la API de Whisp ni ninguna API key**: es verificación visual embebida.
Verificado que Whisp permite el iframe (no manda `X-Frame-Options` ni `frame-ancestors`).

Lo que sí necesita es el `geoId`, y ese lo produce AgStack desde el backend.

### 13.5 El fallo silencioso que hay que conocer

`refreshGeoId()` hace `if (data.geoId) { ... }` **sin rama `else`**. Si el backend
responde `200` con `geoId` nulo —lo que ocurre siempre que AgStack no está configurado o
el login falla— no hay error, ni mensaje, ni cambio visual. El motivo existe solo en el
log del backend.

Ante "el botón no hace nada", el primer paso NO es leer código del frontend:

```bash
docker exec <contenedor-be> env | grep AGSTACK
docker logs <contenedor-be> --since 30m 2>&1 | grep -iE "agstack|geoid"
```

### 13.6 No hay registro masivo

Cada parcela se registra a mano, abriendo su globo y pulsando *Actualizar*. No existe una
acción en lote. Para cientos de productores esto no escala; está anotado como pendiente.


---

## 14. Configuración por empresa, semanas y trampas de este formulario

> Escrito el **2026-09-04**, al implementar los pedidos de Fortaleza. Lo marcado
> como *verificado* se comprobó con build o con datos reales ese día; lo marcado
> como *supuesto* no, y hay que tratarlo como pendiente.

### 14.1 Cómo se agrega una opción por empresa

`company.configuration` es una columna **jsonb libre** (`Map<String,Object>` en la
entidad, `{ [key: string]: any }` en `ApiCompany`). Agregar una opción **no
requiere migración ni tocar el modelo de la API**: se lee con
`companyProfile?.configuration?.<clave>` y se escribe en `company-detail`
(control + carga en `getCompany()` + `disable()` si no es admin + las **dos**
ramas de guardado, `update()` y `create()`; olvidarse de una es el error típico).

Claves vigentes:

| Clave | Qué hace |
|---|---|
| `onlyOrganicProduction` | Automatiza y oculta la certificación orgánica |
| `onlyNacionalVariety` | Fija la variedad y oculta el campo |
| `enableParcelLot` | Muestra Lote (Parcela) en registro y procesamiento |
| `numericVarietyOptions` | Variedad como `"1"`/`"2"` (ver §12) |
| `weekNumberingScheme` | `ISO` (ausente = este) o `FIRST_MONDAY` |
| `weekColorCodes` | Muestra el color de la semana |
| `parcelLotFreeText` | N° Parcela como caja de texto, iniciada en 1 |
| `fixedPricePerUnit` + `fixedPricesBySemiProduct` | Precio fijo por producto, solo lectura en Entregas |

**Todas apagadas por defecto**, y esa es la regla al agregar la próxima: si el
valor ausente no reproduce exactamente el comportamiento anterior, cambiaste el
sistema para todas las empresas sin querer.

### 14.2 Semanas: `week-number.util.ts` es espejo de `WeekNumberTools.java`

Fortaleza no usa ISO-8601: su semana 1 empieza el **primer lunes de enero** y
corre de lunes a viernes. **Verificado 2026-09-04** contra su tabla completa, y
las dos implementaciones comparadas entre sí sobre las 1.827 fechas de 2024 a
2028 en ambos esquemas: cero diferencias.

- **El backend recalcula y descarta lo que manda el frontend**
  (`StockOrderService.createOrUpdateStockOrder`). Un arreglo solo en el cliente
  **no se guarda**. Si cambiás la regla acá, cambiala allá.
- **Sábado y domingo no tienen semana** bajo ese esquema: el cálculo devuelve
  `null` y el campo queda vacío para escribirlo a mano. No lo "arregles"
  devolviendo un número.
- El **color** sale de `(semana − 1) mod 5` sobre ROJO, AZUL, BLANCO, VERDE,
  AMARILLO. Depende solo del número, por eso cada año vuelve a empezar en ROJO
  (la 52 es AZUL y la 1 siguiente ROJO): **es correcto, confirmado con el
  cliente**, no es un bug de continuidad.
- Procesamiento usa el **mismo** calendario. Si Entrega dice 35, el código de
  lote no puede decir 36 el mismo día.

### 14.3 Trampa: `generateFormFromMetadata` ya creó el control

Costó un reporte del cliente el 2026-09-04. Este patrón, que está repetido en
todo el formulario de Entrega, **no hace nada**:

```ts
if (!this.stockOrderForm.get('parcelLot')) {
  this.stockOrderForm.addControl('parcelLot', new FormControl('1'));  // nunca corre
}
```

`parcelLot`, `weekNumber`, `variety`, `organicCertification`,
`moisturePercentage` y compañía **ya vienen en `ApiStockOrder.formMetadata()`**,
así que el control existe desde que se genera el formulario y la rama nunca se
ejecuta. Da igual mientras el valor por defecto sea `null`; en cuanto querés otro
hay que ponerlo en la rama `else`, como hace `variety`. **No falla, no avisa: el
campo sale vacío.**

### 14.4 Trampa: la profundidad de los imports, y por qué el error es invisible

`api/` vive en `src/`, pero `shared-services/`, `shared/` y `core/` viven en
`src/app/`. Copiar la profundidad de un import de `api/` para uno de
`shared-services/` da **un nivel de más**.

Lo grave no es el error, es cómo se presenta: el build termina en `exit 1` con la
salida **cortada a mitad de una palabra**, sin ninguna línea de error, sepultado
bajo cientos de warnings de deprecación de Sass. Hubo que aislarlo por bisección
(guardar y restaurar cambios por partes). Si te pasa un build que falla sin decir
por qué, **empezá por los imports que agregaste**; y arreglar los `@import`
deprecados de Sass haría visibles los errores reales.

### 14.5 Guardar deja el formulario limpio, y el combo se duplicaba

"Guardar" en Entregas **no vuelve al listado**: guarda, limpia y deja el
formulario listo para la siguiente, con un aviso de confirmación —sin él, el
formulario se vacía y no se distingue de haber perdido el registro—. Para volver
está "Guardar y cerrar". Antes era al revés: cerraba justo en el caso de entrega
nueva, que es cuando se cargan varias seguidas.

Al recargar el formulario, `initializeData()` llena el combo de Semiproducto con
`push`. **Sin vaciar `this.options` antes, la lista se duplica en cada guardado.**
Ya pasaba al editar; con este cambio afectaría a todos.

### 14.6 Estado del repo que conviene saber

- **`nx lint inatrace-fe` está roto** a nivel de configuración: falla al cargar
  el plugin `@angular-eslint` antes de mirar ningún archivo. No es tu cambio.
- **`generateFarmerPdf` / `generateFarmerPdfFromData` no los llama nadie.** El
  PDF real de la entrega es `generatePdfFromElement`, que renderiza el propio
  formulario — por eso lo que agregues a la pantalla sale solo en el PDF.
