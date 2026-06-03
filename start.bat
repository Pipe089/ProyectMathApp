@echo off
REM Script para ejecutar el proyecto con Docker en Windows

echo ================================
echo ProyectMathApp - Docker Setup
echo ================================
echo.

REM Crear .env si no existe
if not exist .env (
    echo Creando archivo .env...
    copy .env.example .env
    echo. .env creado. Completa las credenciales de Supabase en .env
    echo.
)

REM Build y run
echo Iniciando servicios con Docker Compose...
docker-compose up --build

echo.
echo ================================
echo Servicios iniciados
echo ================================
echo.
echo Accede a:
echo   - Frontend: http://localhost
echo   - Backend API: http://localhost:3000/api
echo.
pause
