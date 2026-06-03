# Guía Rápida: ProyectMathApp con Docker

## Paso 1: Preparación
1. Abre `start.bat` (Windows) o `start.sh` (Mac/Linux)
2. El script creará `.env` automáticamente

## Paso 2: Configurar Supabase
Abre `.env` y completa:
```
SUPABASE_URL=https://vvivungsdpyyowuwbffh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<TU_LLAVE_DE_SERVICIO>
```

## Paso 3: Iniciar servicios
Ejecuta el script `start.bat` o:
```bash
docker-compose up --build
```

## Paso 4: Acceder
- Frontend: http://localhost
- Backend API: http://localhost:3000/api

## Parar servicios
```bash
docker-compose down
```

---

### 📖 Documentación completa
Ver `DOCKER.md` para más detalles.
