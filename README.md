# MoneyTalk - Frontend

Aplicación web progresiva (PWA) para registrar ingresos y gastos por voz o texto, con reportes y recomendaciones financieras generadas con IA.

**Stack:** React 19, TypeScript, Vite 8, React Router 7, Zustand 5, Tailwind CSS 3 + daisyUI 4, Chart.js, Vitest.

## Puesta en marcha

Requisitos: Node.js 20 o superior y pnpm 10.

1. Instala las dependencias:
   ```bash
   pnpm install
   ```
2. Copia `.env.example` a `.env`:
   - `VITE_API_URL`: URL del backend, con `/api` al final (por defecto `http://localhost:3000/api`).
   - `VITE_GOOGLE_CLIENT_ID` (opcional): sin él, el botón de Google no se muestra.
   - `VITE_VAPID_PUBLIC_KEY` (opcional): clave pública VAPID del backend, necesaria para las notificaciones push.
3. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Verifica tipos y genera `dist/` con el service worker |
| `pnpm preview` | Sirve el build (necesario para probar la PWA y las notificaciones) |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests con Vitest |

## Estructura

```
src/
  api/          Cliente HTTP único (axios) y un módulo tipado por recurso
  stores/       Estado global con Zustand (auth, transacciones, categorías, metas, IA, UI)
  pages/        Una página por ruta (carga diferida)
  components/   UI compartida (ui/), layout, formularios y modales
  hooks/        Voz, notificaciones, detección de conexión
  types/        Tipos del dominio compartidos
  utils/        Fechas y formato de moneda
  sw.ts         Service worker: precache de la app y notificaciones push
```

## Decisiones importantes

- **Todas las llamadas al backend pasan por `src/api/`.** El cliente agrega el token, renueva la sesión una sola vez aunque fallen varias peticiones a la vez y muestra un único mensaje por error.
- **Los totales se calculan en el servidor** (`/transactions/summary`); el navegador nunca descarga todas las transacciones.
- **Fechas como días de calendario** (`YYYY-MM-DD`) en todo el flujo, para que no se corran un día por la zona horaria.
- **Sin conexión**, las transacciones nuevas quedan en una cola local y se envían al reconectar.
- **Al cerrar sesión** se limpia todo el estado guardado, para que otro usuario del mismo dispositivo no vea datos ajenos.
- El service worker no guarda en caché respuestas de la API, solo los archivos de la aplicación.
