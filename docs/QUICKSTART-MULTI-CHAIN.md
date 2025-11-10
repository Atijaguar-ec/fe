# ⚡ QuickStart: Desarrollo Multi-Cadena

Guía rápida de 2 minutos para empezar a trabajar con diferentes cadenas de valor.

---

## 🎯 Lo Más Importante

### Comandos Ultra-Rápidos

```bash
npm run camaron    # 🦐 Trabajar con Camarón
npm run cacao      # 🍫 Trabajar con Cacao
npm run cafe       # ☕ Trabajar con Café
```

**¡Eso es todo!** Estos comandos:
- ✅ Sincronizan traducciones automáticamente
- ✅ Configuran el producto correcto
- ✅ Levantan el servidor de desarrollo
- ✅ Usan la terminología correcta

---

## 🚀 Setup Inicial (Solo Primera Vez)

```bash
cd fe
npm install
npm run translations:sync
```

---

## 📖 Escenarios Comunes

### Escenario 1: Trabajar con Camarón

```bash
npm run camaron
```

Verás en la UI:
- ✅ "Piscicultor" (no "Agricultor")
- ✅ "Acopiador" (no "Colector")
- ✅ "libras" (no "kg")
- ✅ "Cosechas" (no "Entregas")

### Escenario 2: Cambiar de Camarón a Cacao

```bash
# Ctrl+C para parar el servidor actual
npm run cacao
```

Verás en la UI:
- ✅ "Agricultor"
- ✅ "Colector"
- ✅ "kg"
- ✅ "Entregas"

### Escenario 3: Agregar Nueva Traducción

```bash
# 1. Edita el archivo base
vim src/assets/locale/_base/es.base.json

# 2. Sincroniza
npm run translations:sync

# 3. Reinicia servidor (Ctrl+C y vuelve a correr)
npm run camaron
```

### Escenario 4: Agregar Traducción Específica para Camarón

```bash
# 1. Edita overrides
vim scripts/chain-translations/chain-overrides.config.ts

# Agregar en shrimp.es:
# 'mi.nueva.clave': 'Texto específico para camarón'

# 2. Sincroniza
npm run translations:sync

# 3. Reinicia
npm run camaron
```

---

## 🔧 Comandos Útiles

```bash
# Ver cambios sin aplicar
npm run translations:sync:dry-run

# Validar traducciones
npm run translations:validate

# Cambiar cadena sin levantar servidor
npm run chain:switch shrimp

# Build para producción
npm run build:shrimp
```

---

## ❓ FAQ Rápido

### ¿Por qué no veo "Piscicultor"?

**R:** Asegúrate de usar `npm run camaron` (no `npm run dev`).

### ¿Cómo sé en qué cadena estoy?

**R:** Mira la terminal donde corriste el comando o revisa `src/assets/env.js` línea 24.

### ¿Puedo tener múltiples terminales con diferentes cadenas?

**R:** No recomendado. Cada comando modifica `env.js` global. Usa solo una cadena a la vez.

### ¿Qué hago si algo no funciona?

```bash
# Limpia y reinicia
npm run translations:sync
npm run camaron
```

---

## 📚 Documentación Completa

Para detalles avanzados, consulta:
- **Guía completa:** `docs/TRADUCCIONES-MULTI-CADENA.md`
- **Scripts:** `scripts/chain-translations/README.md`
- **Arquitectura:** `/docs/tecnico/arquitectura-multi-cadena.md`

---

## 🎓 Cheat Sheet

| Tarea | Comando |
|-------|---------|
| Desarrollar Camarón | `npm run camaron` |
| Desarrollar Cacao | `npm run cacao` |
| Desarrollar Café | `npm run cafe` |
| Sincronizar traducciones | `npm run translations:sync` |
| Validar traducciones | `npm run translations:validate` |
| Cambiar cadena | `npm run chain:switch <cadena>` |
| Build producción | `npm run build:<cadena>` |

---

**¿Listo?** Empieza ahora:

```bash
npm run camaron
```

🎉 **Happy coding!**
