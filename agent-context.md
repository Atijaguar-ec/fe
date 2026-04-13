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
