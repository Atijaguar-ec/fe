# AGENTS.md · INATrace Frontend

> **Audience:** AI Coding Agents, Copilots, and Automated Reviewers.  
> **Repository:** `fe` (Angular 19 / Nx Monorepo / Module Federation).

---

## 1. Primary Entrypoint for AI Agents

👉 **Read [`agent-context.md`](agent-context.md) first.** It contains all Nx build targets, microfrontend configuration (`shrimpMfe`), `keycloak-angular` OIDC setup, environment substitution rules, and staging deployment procedures.

---

## 2. Quick Invariants

1. **Monorepo:** Managed with Nx 22 / Angular 19. Core app is `apps/inatrace-fe`. Shared libraries live in `libs/` (`shared-ui`, `shared-auth`, `shared-models`).
2. **Build Commands:**
   - Fortaleza del Valle (with shrimp microfrontend): `NX_DAEMON=false npm run build:prod`
   - UNOCACE (standalone cacao without shrimp): `npm run build:standalone`
3. **Authentication:** OpenID Connect with Keycloak 26 via `keycloak-angular`. Public routes must be registered in `publicPattern` in `auth.provider.ts`.
4. **Environment Variables:** `assets/env.js` is generated dynamically at runtime (`envsubst` in Docker for Fortaleza, CI script for UNOCACE).
5. **No Direct DOM Manipulation:** Follow Angular standard lifecycle and reactive forms.
