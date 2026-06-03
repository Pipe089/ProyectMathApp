# Backend

Este directorio contiene el servidor Node.js del proyecto.

- `server.js`: servidor Express que sirve el contenido estático desde `../frontend`.
- `package.json`: dependencias y script para ejecutar el backend.

Uso:

```bash
cd backend
npm install
```

Configura las credenciales de Supabase:

1. Copia `backend/.env.example` a `backend/.env`
2. Completa `SUPABASE_SERVICE_ROLE_KEY` con tu llave de servicio

Luego ejecuta:

```bash
npm start
```
