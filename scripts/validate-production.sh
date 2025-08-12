#!/bin/bash

# Script de validación para configuración de producción
# Uso: ./scripts/validate-production.sh

set -e

echo "🔍 INATrace - Validación de Configuración de Producción"
echo "======================================================="
echo "Fecha: $(date)"
echo ""

# Variables
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8080}"
ERRORS=0

# Función para reportar errores
report_error() {
    echo "❌ ERROR: $1"
    ERRORS=$((ERRORS + 1))
}

# Función para reportar éxito
report_success() {
    echo "✅ $1"
}

# Función para reportar advertencia
report_warning() {
    echo "⚠️  ADVERTENCIA: $1"
}

echo "📋 Configuración a validar:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend: $BACKEND_URL"
echo ""

# 1. Verificar configuración de env.js
echo "1️⃣  Verificando configuración del frontend..."

if [ -f "src/assets/env.js" ]; then
    if grep -q "appBaseUrl.*''" src/assets/env.js; then
        report_success "env.js configurado para producción (rutas relativas)"
    elif grep -q "appBaseUrl.*''" src/assets/env.js; then
        report_error "env.js tiene appBaseUrl vacío pero con comillas incorrectas"
    else
        report_error "env.js NO está configurado para producción (appBaseUrl debe estar vacío)"
        echo "   Actual: $(grep appBaseUrl src/assets/env.js)"
        echo "   Esperado: window['env']['appBaseUrl'] = '';"
    fi
else
    report_error "Archivo src/assets/env.js no encontrado"
fi

# 2. Verificar configuración de Nginx
echo ""
echo "2️⃣  Verificando configuración de Nginx..."

if [ -f "nginx.conf" ]; then
    if grep -q "location /api/" nginx.conf; then
        report_success "nginx.conf tiene configuración para /api/"
        
        if grep -q "proxy_pass.*127.0.0.1:8080" nginx.conf; then
            report_success "nginx.conf apunta al backend local (127.0.0.1:8080)"
        elif grep -q "proxy_pass.*localhost:8080" nginx.conf; then
            report_warning "nginx.conf usa localhost en lugar de 127.0.0.1"
        elif grep -q "proxy_pass.*host.docker.internal" nginx.conf; then
            report_warning "nginx.conf usa host.docker.internal (puede no funcionar en todos los entornos)"
        else
            report_error "nginx.conf no tiene proxy_pass configurado correctamente"
        fi
    else
        report_error "nginx.conf NO tiene configuración para /api/"
    fi
else
    report_error "Archivo nginx.conf no encontrado"
fi

# 3. Verificar que el backend esté corriendo
echo ""
echo "3️⃣  Verificando backend..."

if curl -f $BACKEND_URL/actuator/health > /dev/null 2>&1; then
    report_success "Backend responde en $BACKEND_URL"
elif curl -f $BACKEND_URL > /dev/null 2>&1; then
    report_warning "Backend responde pero no tiene endpoint /actuator/health"
else
    report_error "Backend NO responde en $BACKEND_URL"
fi

# 4. Verificar que el frontend esté corriendo (si aplica)
echo ""
echo "4️⃣  Verificando frontend..."

if curl -f $FRONTEND_URL > /dev/null 2>&1; then
    report_success "Frontend responde en $FRONTEND_URL"
    
    # Verificar que las APIs se enruten correctamente
    echo ""
    echo "5️⃣  Verificando enrutamiento de APIs..."
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/api/user/login)
    
    if [ "$RESPONSE" = "405" ]; then
        report_success "APIs se enrutan correctamente (405 Method Not Allowed es esperado para GET)"
    elif [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "401" ]; then
        report_success "APIs se enrutan correctamente (código $RESPONSE del backend)"
    elif [ "$RESPONSE" = "200" ]; then
        # Verificar si la respuesta es HTML (frontend) o JSON (backend)
        CONTENT_TYPE=$(curl -s -I $FRONTEND_URL/api/user/login | grep -i content-type | head -1)
        if echo "$CONTENT_TYPE" | grep -q "text/html"; then
            report_error "APIs devuelven HTML del frontend en lugar de JSON del backend"
            echo "   Nginx NO está enrutando /api/ correctamente"
        else
            report_success "APIs se enrutan correctamente al backend"
        fi
    else
        report_warning "Respuesta inesperada de APIs (código: $RESPONSE)"
    fi
else
    report_warning "Frontend no responde en $FRONTEND_URL (puede no estar desplegado aún)"
fi

# 6. Verificar archivos de configuración adicionales
echo ""
echo "6️⃣  Verificando archivos adicionales..."

if [ -f "nginx-production.conf" ]; then
    report_success "Archivo nginx-production.conf encontrado"
else
    report_warning "Archivo nginx-production.conf no encontrado (opcional)"
fi

if [ -f "src/assets/env.development.js" ]; then
    report_success "Archivo env.development.js encontrado"
else
    report_warning "Archivo env.development.js no encontrado (recomendado para desarrollo)"
fi

if [ -f "scripts/deploy-production.sh" ]; then
    report_success "Script de despliegue encontrado"
    if [ -x "scripts/deploy-production.sh" ]; then
        report_success "Script de despliegue es ejecutable"
    else
        report_warning "Script de despliegue no es ejecutable (ejecutar: chmod +x scripts/deploy-production.sh)"
    fi
else
    report_warning "Script de despliegue no encontrado"
fi

# 7. Verificar Docker
echo ""
echo "7️⃣  Verificando Docker..."

if command -v docker > /dev/null 2>&1; then
    report_success "Docker está instalado"
    
    if docker ps > /dev/null 2>&1; then
        report_success "Docker está corriendo"
    else
        report_error "Docker no está corriendo o no tienes permisos"
    fi
else
    report_error "Docker no está instalado"
fi

# Resumen final
echo ""
echo "📊 RESUMEN DE VALIDACIÓN"
echo "========================"

if [ $ERRORS -eq 0 ]; then
    echo "🎉 ¡Configuración validada exitosamente!"
    echo "   Todo está listo para producción"
    echo ""
    echo "💡 Próximos pasos:"
    echo "   1. Ejecutar: ./scripts/deploy-production.sh"
    echo "   2. Verificar: curl -X POST $FRONTEND_URL/api/user/login"
    echo "   3. Acceder: $FRONTEND_URL"
else
    echo "❌ Se encontraron $ERRORS errores"
    echo "   Corrige los errores antes de desplegar en producción"
    exit 1
fi

echo ""
echo "✅ Validación completada"
echo "   Fecha: $(date)"
