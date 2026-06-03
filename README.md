# ProyectMathApp
Este es un proyecto web de gamificación en matemáticas para niños de primer y segundo grado.

## Estructura del proyecto
- `frontend/`: HTML, CSS y JavaScript del cliente.
- `backend/`: servidor Node.js y APIs.

> Nota: para que se guarden los datos de progreso en Supabase, debes aplicar las políticas RLS.
> Copia el contenido de `POLITICAS_RLS_PROGRESO.sql` y pégalo en el SQL Editor de Supabase.

## Ejecutar con Docker

### Inicio rápido (Windows)
Haz doble clic en `start.bat`

### Inicio manual

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Completa tu `SUPABASE_SERVICE_ROLE_KEY` en `.env`

3. Construye y ejecuta con Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Accede a:
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:3000/api

### Detener servicios
```bash
docker-compose down
```

## 📖 Documentación

- [Guía Rápida Docker](INICIO_RAPIDO_DOCKER.md)
- [Documentación Docker Completa](DOCKER.md)

## 🎮 Características

- ✅ Autenticación con Supabase
- ✅ Perfiles de usuario con grados (1.º y 2.º)
- ✅ Juegos didácticos de sumas básicas y avanzadas
- ✅ Sistema de puntos de experiencia
- ✅ Registro de resultados y progreso por usuario
- ✅ Dashboard con visualización de progreso
- ✅ Backend con API REST
- ✅ Frontend responsive

## 📦 Stack tecnológico

- **Frontend**: HTML5, CSS3, JavaScript vanilla, Supabase JS
- **Backend**: Node.js, Express, Supabase Admin SDK
- **Base de datos**: Supabase (PostgreSQL)
- **Contenedores**: Docker, Docker Compose
- **Servidor web**: Nginx (frontend)

## 🚀 Versiones y Cambios

### v1.0Beta - 2026-04-25
- Funcionalidad: Se añadió método de Login y Registro
- Conectividad con Supabase
- Juego didáctico de sumas básicas con puntos de experiencia
- Resultados y progreso guardados por usuario en la base de datos
- Mejora en UI y UX
- Mantiene conectividad de inicio de sesión hasta que se haga un cierre de sesión
