#!/bin/bash

# Script para ejecutar el proyecto con Docker

set -e

echo "================================"
echo "ProyectMathApp - Docker Setup"
echo "================================"

# Crear .env si no existe
if [ ! -f .env ]; then
    echo "Creando archivo .env..."
    cp .env.example .env
    echo "✓ Archivo .env creado. Completa las credenciales de Supabase."
    echo ""
fi

# Build y run
echo "Iniciando servicios con Docker Compose..."
docker-compose up --build

echo ""
echo "================================"
echo "✓ Servicios iniciados"
echo "================================"
echo ""
echo "Accede a:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:3000/api"
echo ""
