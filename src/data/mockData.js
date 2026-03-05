// TODO: Migrar sucursales, barberos y servicios a Firestore para gestión dinámica
// Actualmente estos datos están hardcodeados. La colección 'services' ya tiene reglas
// en Firebase Rules, y los barberos se cargan desde Firestore en DataContext,
// pero el BookingWizard aún usa estos datos estáticos como fallback.
export const BRANCHES = [
  { id: 'centro', name: 'Centro', address: 'Mariano Abasolo 59 B San Juan del Rio, Qro' },
  { id: 'lomas', name: 'Lomas', address: 'Av. Lomas de San Juan 1129 San Juan del Rio, Qro' }
];

export const BARBERS = [
  {
    id: 1,
    name: 'Carlos',
    specialty: 'Fade Master',
    rating: 4.9,
    branch: 'Centro',
    schedule: {
      0: { start: '10:00', end: '15:00', active: true }, // Dom
      1: { start: '10:00', end: '19:00', active: true }, // Lun
      2: { start: '10:00', end: '19:00', active: true }, // Mar
      3: { start: '10:00', end: '19:00', active: true }, // Mie
      4: { start: '10:00', end: '19:00', active: true }, // Jue
      5: { start: '10:00', end: '19:00', active: true }, // Vie
      6: { start: '10:00', end: '19:00', active: true }  // Sab
    }
  },
  {
    id: 2,
    name: 'Ana',
    specialty: 'Colorista & Estilo',
    rating: 4.8,
    branch: 'Lomas',
    schedule: {
      0: { start: '10:00', end: '15:00', active: true },
      1: { start: '10:00', end: '20:00', active: true },
      2: { start: '10:00', end: '20:00', active: true },
      3: { start: '10:00', end: '20:00', active: true },
      4: { start: '10:00', end: '20:00', active: true },
      5: { start: '10:00', end: '20:00', active: true },
      6: { start: '10:00', end: '20:00', active: true }
    }
  },
  {
    id: 3,
    name: 'Luis',
    specialty: 'Corte Clásico',
    rating: 4.7,
    branch: 'Centro',
    schedule: {
      0: { start: '10:00', end: '15:00', active: true },
      1: { start: '10:00', end: '19:00', active: true },
      2: { start: '10:00', end: '19:00', active: true },
      3: { start: '10:00', end: '19:00', active: true },
      4: { start: '10:00', end: '19:00', active: true },
      5: { start: '10:00', end: '19:00', active: true },
      6: { start: '10:00', end: '19:00', active: true }
    }
  },
  {
    id: 4,
    name: 'Roberto',
    specialty: 'Navaja Libre',
    rating: 4.8,
    branch: 'Lomas',
    schedule: {
      0: { start: '10:00', end: '15:00', active: true },
      1: { start: '10:00', end: '20:00', active: true },
      2: { start: '10:00', end: '20:00', active: true },
      3: { start: '10:00', end: '20:00', active: true },
      4: { start: '10:00', end: '20:00', active: true },
      5: { start: '10:00', end: '20:00', active: true },
      6: { start: '10:00', end: '20:00', active: true }
    }
  },
];

export const SERVICES = [
  { id: 1, name: 'Corte Fade/Lavado', price: 300, duration: 60, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 2, name: 'Corte Fade', price: 229, duration: 45, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 3, name: 'Corte Clásico', price: 229, duration: 45, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 4, name: 'Corte a Tijera', price: 229, duration: 45, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 5, name: 'Grecas', price: 50, duration: 15, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 6, name: 'Arreglo de Barba', price: 180, duration: 30, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 7, name: 'Desvanecido de Barba', price: 210, duration: 35, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 8, name: 'Toallas Calientes', price: 180, duration: 20, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 9, name: 'Exfoliación Facial', price: 129, duration: 20, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 10, name: 'Mascarilla Negra', price: 129, duration: 20, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 11, name: 'Perfilación de Cejas', price: 30, duration: 10, bufferTime: 2, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 12, name: 'Wax Facial (Orejas/Nariz)', price: 80, duration: 15, bufferTime: 2, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 13, name: 'Lavado', price: 80, duration: 15, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 14, name: 'Colormetría', price: 500, duration: 90, bufferTime: 10, assignedTo: 'Ana', branch: 'Ambas' },
];

// TIME_SLOTS eliminado — no se usaba en ningún componente.
// BookingWizard genera los horarios dinámicamente con generateTimeSlots().
