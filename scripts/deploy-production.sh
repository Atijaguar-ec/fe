#!/bin/bash

# Script de despliegue profesional para INATrace Frontend
# Uso: ./scripts/deploy-production.sh

set -e

echo "🚀 INATrace Frontend - Despliegue en Producción"
echo "================================================"
echo "Fecha: $(date)"
echo ""

# Variables de configuración
CONTAINER_NAME="${CONTAINER_NAME:-inatrace-frontend}"
IMAGE_NAME="${IMAGE_NAME:-inatrace-fe}"
TAG="${TAG:-latest}"
PORT="${PORT:-80}"

echo "📋 Configuración:"
echo "   Contenedor: $CONTAINER_NAME"
echo "   Imagen: $IMAGE_NAME:$TAG"
echo "   Puerto: $PORT"
echo ""

# Función para verificar que el backend esté corriendo
check_backend() {
    echo "🔍 Verificando backend..."
    if curl -f http://127.0.0.1:8080/actuator/health > /dev/null 2>&1; then
        echo "✅ Backend está corriendo en puerto 8080"
    else
        echo "⚠️  Backend no responde en puerto 8080"
        echo "   Asegúrate de que el backend esté corriendo antes de continuar"
        read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Función para construir la imagen
build_image() {
    echo "🔨 Construyendo imagen Docker..."
    
    # Verificar que env.js esté configurado para producción
    if grep -q "appBaseUrl.*''" src/assets/env.js; then
        echo "✅ env.js configurado para producción (rutas relativas)"
    else
        echo "❌ ERROR: env.js no está configurado para producción"
        echo "   appBaseUrl debe estar vacío ('') para usar rutas relativas"
        exit 1
    fi
    
    # Construir imagen
    docker build -t $IMAGE_NAME:$TAG .
    
    if [ $? -eq 0 ]; then
        echo "✅ Imagen construida exitosamente"
    else
        echo "❌ Error al construir la imagen"
        exit 1
    fi
}

# Función para parar contenedor anterior
stop_old_container() {
    echo "🛑 Parando contenedor anterior..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        docker stop $CONTAINER_NAME
        echo "✅ Contenedor anterior detenido"
    else
        echo "ℹ️  No hay contenedor anterior corriendo"
    fi
    
    if docker ps -a -q -f name=$CONTAINER_NAME | grep -q .; then
        docker rm $CONTAINER_NAME
        echo "✅ Contenedor anterior eliminado"
    fi
}

# Función para iniciar nuevo contenedor
start_new_container() {
    echo "🚀 Iniciando nuevo contenedor..."
    
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $PORT:80 \
        $IMAGE_NAME:$TAG
    
    if [ $? -eq 0 ]; then
        echo "✅ Contenedor iniciado exitosamente"
    else
        echo "❌ Error al iniciar el contenedor"
        exit 1
    fi
}

# Función para verificar el despliegue
verify_deployment() {
    echo "🔍 Verificando despliegue..."
    
    # Esperar un momento para que el contenedor inicie
    sleep 5
    
    # Verificar que el contenedor esté corriendo
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        echo "✅ Contenedor está corriendo"
    else
        echo "❌ Contenedor no está corriendo"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    
    # Verificar que el frontend responda
    if curl -f http://localhost:$PORT > /dev/null 2>&1; then
        echo "✅ Frontend responde en puerto $PORT"
    else
        echo "❌ Frontend no responde en puerto $PORT"
        exit 1
    fi
    
    # Verificar que las APIs se enruten correctamente
    echo "🔍 Verificando enrutamiento de APIs..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/user/login)
    
    if [ "$RESPONSE" = "405" ] || [ "$RESPONSE" = "400" ]; then
        echo "✅ APIs se enrutan correctamente al backend (código: $RESPONSE)"
    else
        echo "⚠️  APIs pueden no estar enrutándose correctamente (código: $RESPONSE)"
        echo "   Verifica la configuración de Nginx"
    fi
}

# Función para mostrar información post-despliegue
show_info() {
    echo ""
    echo "🎉 ¡Despliegue completado exitosamente!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   🌐 Frontend: http://localhost:$PORT"
    echo "   🔧 Backend: http://localhost:8080"
    echo "   📊 Logs: docker logs $CONTAINER_NAME"
    echo "   🛑 Parar: docker stop $CONTAINER_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Comandos útiles:"
    echo "   Ver logs en tiempo real: docker logs -f $CONTAINER_NAME"
    echo "   Reiniciar contenedor: docker restart $CONTAINER_NAME"
    echo "   Verificar estado: docker ps | grep $CONTAINER_NAME"
    echo ""
}

# Función principal
main() {
    check_backend
    build_image
    stop_old_container
    start_new_container
    verify_deployment
    show_info
    
    echo "✅ Despliegue completado"
    echo "   Fecha: $(date)"
}

# Ejecutar función principal
main "$@"
