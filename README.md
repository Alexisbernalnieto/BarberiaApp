# El Coronel Barbón — citas y pagos para barberías

App de citas para barberías, multi-sucursal: el cliente reserva, la barbería administra su agenda y el cobro sale por Stripe. Corre como app móvil (iOS/Android) y como web desde el mismo código.

Proyecto en equipo de 4 personas. **Mi parte:** adaptar la plataforma para que sirviera a varias barberías en vez de una, la migración de los datos que ya existían, el portal de administración, la facturación y los correos automáticos.

Demo: https://barberia-app-c4c2b.web.app

## Stack

- **App:** React Native 0.76 + Expo 52, TypeScript, `react-native-web` para la versión web
- **Backend:** Firebase — Firestore, Auth y Cloud Functions (`functions/`)
- **Pagos:** Stripe (`@stripe/stripe-react-native` en móvil, `@stripe/react-stripe-js` en web)
- **UI:** `react-native-calendars` para la agenda, `react-native-chart-kit` para las métricas, `lucide-react` para iconos

## Correr en local

```bash
npm install
npx expo start
```

Necesitas un proyecto de Firebase propio y las llaves de prueba de Stripe. La configuración va en las variables de entorno de Expo; las reglas de Firestore que usa el proyecto están en `FIREBASE_RULES.txt`.

Para las Cloud Functions:

```bash
cd functions && npm install && npm run deploy
```

## Estructura

```
src/          pantallas, componentes y acceso a Firestore
functions/    Cloud Functions (pagos, correos, tareas programadas)
scripts/      utilidades de migración de datos
dist/         build web publicado en Firebase Hosting
```
