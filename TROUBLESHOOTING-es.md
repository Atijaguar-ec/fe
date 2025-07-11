# Problemas frecuentes y soluciones INATrace FE

Este documento recopila los principales problemas encontrados durante la instalación, configuración y uso del frontend de INATrace, junto con sus soluciones probadas.

---

## 1. Error "Empty key" al iniciar sesión
**Síntoma:**
- El backend lanza un error `java.lang.IllegalArgumentException: Empty key` y no permite autenticación.

**Causa:**
- Falta o valor vacío de la clave secreta JWT en la configuración del backend.

**Solución:**
- Añadir una clave secreta en la configuración del backend (`application.properties`, `application.yml` o variable de entorno):
  ```
  jwt.secret=unaClaveSuperSegura
  ```
- Reiniciar el backend.

---

## 2. "Por el momento usted no tiene empresas asignadas. Contacte a su administrador"
**Síntoma:**
- El usuario puede iniciar sesión pero no accede a funcionalidades.

**Causa:**
- El usuario no está vinculado a ninguna empresa en el sistema.

**Solución:**
- Un administrador debe asignar el usuario a una empresa desde el panel de administración.
- Alternativamente, realizar la asignación directamente en la base de datos (solo para pruebas y con precaución).

---

## 3. Errores de compatibilidad con Node.js (ej: ERR_OSSL_EVP_UNSUPPORTED)
**Síntoma:**
- El frontend no compila o lanza errores relacionados con Webpack y Node.js.

**Causa:**
- Uso de una versión de Node.js no soportada (debe ser 14.x).

**Solución:**
- Instalar y seleccionar Node 14.x usando `nvm`:
  ```bash
  nvm install 14
  nvm use 14
  ```
- Reinstalar dependencias con `npm install --legacy-peer-deps`.

---

## 4. Errores de tipos TypeScript con mapbox-gl y APIs web
**Síntoma:**
- Errores de compilación relacionados con tipos de Mapbox o APIs como GeolocationPosition.

**Causa:**
- Incompatibilidad de versiones o falta de tipos.

**Solución:**
- Bajar la versión de `mapbox-gl` a `^1.13.0` en `package.json`.
- Instalar tipos faltantes (`npm install --save-dev @types/mapbox-gl`).

---

## 5. Problemas de conexión frontend-backend (EHOSTUNREACH)
**Síntoma:**
- El frontend no puede comunicarse con el backend, errores de proxy o CORS.

**Causa:**
- IP/puerto incorrectos o backend no accesible desde el frontend.

**Solución:**
- Verificar que el backend esté corriendo y accesible desde la IP configurada en el proxy (`proxy.conf.json`) y en los archivos de entorno.

---

## 6. No se recibe el correo de activación
**Síntoma:**
- Tras registrarse, el usuario no recibe el email de activación.

**Causa:**
- Problemas de configuración SMTP en el backend, o correo en la carpeta de spam.

**Solución:**
- Revisar la configuración de envío de correos en el backend.
- Verificar carpeta de spam del usuario.

---

## 7. Otros
- Para cualquier otro problema, revisar los logs del backend y frontend, y consultar la documentación oficial o abrir un issue en el repositorio.
