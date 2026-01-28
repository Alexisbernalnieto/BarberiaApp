export const BRANCHES = [
  { id: 'centro', name: 'Centro', address: 'Mariano Abasolo 59 B San Juan del Rio, Qro' },
  { id: 'lomas', name: 'Lomas', address: 'Av. Lomas de San Juan 1129 San Juan del Rio, Qro' }
];

export const BARBERS = [
  { id: 1, name: 'Carlos', specialty: 'Fade Master', rating: 4.9, branch: 'Centro' },
  { id: 2, name: 'Ana', specialty: 'Colorista & Estilo', rating: 4.8, branch: 'Lomas' },
  { id: 3, name: 'Luis', specialty: 'Corte Clásico', rating: 4.7, branch: 'Centro' },
  { id: 4, name: 'Roberto', specialty: 'Navaja Libre', rating: 4.8, branch: 'Lomas' },
];

export const SERVICES = [
  { id: 1, name: 'Corte Fade/Lavado', price: 300, duration: 60, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 2, name: 'Corte Fade', price: 229, duration: 45, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 3, name: 'Corte Clásico', price: 229, duration: 45, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 4, name: 'Corte a Tijera', price: 229, duration: 45, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 5, name: 'Grecas', price: 50, duration: 15, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 6, name: 'Arreglo de Barba', price: 180, duration: 30, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 7, name: 'Desvanecido de Barba', price: 210, duration: 35, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 8, name: 'Toallas Calientes', price: 180, duration: 20, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 9, name: 'Exfoliación Facial', price: 129, duration: 20, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 10, name: 'Mascarilla Negra', price: 129, duration: 20, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 11, name: 'Perfilación de Cejas', price: 30, duration: 10, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 12, name: 'Wax Facial (Orejas/Nariz)', price: 80, duration: 15, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 13, name: 'Lavado', price: 80, duration: 15, assignedTo: 'Todos', branch: 'Ambas' },
  { id: 14, name: 'Colormetría', price: 500, duration: 90, assignedTo: 'Ana', branch: 'Ambas' },
];

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];
