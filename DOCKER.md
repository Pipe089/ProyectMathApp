# Docker Setup para ProyectMathApp

Este proyecto está configurado para ejecutarse completamente en Docker Desktop.

## 📋 Requisitos

- Docker Desktop instalado y ejecutándose
  - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop)

## 🚀 Inicio rápido

### Opción 1: Script (recomendado)

**Windows:**
```bash
start.bat
```

**Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

### Opción 2: Comandos directos

1. Copia el archivo de configuración:
```bash
cp .env.example .env
```

2. Completa `SUPABASE_SERVICE_ROLE_KEY` en `.env`

3. Inicia los servicios:
```bash
docker-compose up --build
```

## 🌐 Acceso

- **Frontend (Nginx)**: http://localhost
- **Backend API**: http://localhost:3000/api
- **Backend (directo)**: http://localhost:3000

## 📦 Servicios

### Backend
- **Imagen**: Node.js 18 Alpine
- **Puerto interno**: 3000
- **Variables de entorno**: Lee de `.env`

### Frontend
- **Imagen**: Nginx Alpine
- **Puerto interno**: 80
- **Proxy a backend**: `/api/*` → `http://backend:3000`

## 🛑 Detener servicios

```bash
docker-compose down
```

Para remover también volúmenes:
```bash
docker-compose down -v
```

## 🔍 Logs

Ver logs de todos los servicios:
```bash
docker-compose logs -f
```

Ver logs de un servicio específico:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔧 Troubleshooting

### Puerto 80 ocupado
Si el puerto 80 está en uso, modifica `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Cambia a 8080
```

Luego accede a http://localhost:8080

### Puerto 3000 ocupado
```yaml
ports:
  - "3001:3000"  # Cambia a 3001
```

## 📝 Notas

- Los servicios se reinician automáticamente si fallan
- El frontend hace proxy de `/api/` al backend
- Las variables de entorno se cargan desde `.env`
