
// ==========================================
// CONFIGURACIÓN DE DISEÑO (DESIGN TOKENS)
// ==========================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64, // Espaciado para secciones grandes
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40, // Para títulos de impacto
  display: 56, // Para héroes en desktop
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 32,
  round: 9999,
};

// ==========================================
// SHADOWS (SOMBRAS)
// ==========================================
export const SHADOWS = {
  light: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  strong: {
    shadowColor: "#D4AF37", // Gold glow for dark mode or strong emphasis
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  }
};

// ==========================================
// TEMAS DE COLOR
// ==========================================

const COMMON_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  success: '#2E7D32', // Darker green for premium feel
  warning: '#F57F17',
  info: '#0288D1',
  disabled: '#9E9E9E',
  gold: '#D4AF37', // Metallic Gold
  goldLight: '#F4D03F', // Bright Gold
  goldDark: '#AA8C2C', // Dark Gold
  goldDim: 'rgba(212, 175, 55, 0.2)', // Transparent Gold
};

export const LIGHT_THEME = {
  mode: 'light',
  primary: '#D4AF37', // Metallic Gold
  primaryDark: '#AA8C2C',
  accent: '#1A1A1A', // Casi negro para alto contraste
  background: '#F9FAFB', // Cool gray very light
  surface: '#FFFFFF',
  surfaceHighlight: '#F3F4F6',
  text: '#111827', // Gray 900
  textSecondary: '#4B5563', // Gray 600
  textInverse: '#FFFFFF',
  error: '#DC2626',
  inputBg: '#FFFFFF',
  border: '#E5E7EB', // Gray 200
  overlay: 'rgba(0,0,0,0.05)',
  
  ...COMMON_COLORS,
  spacing: SPACING,
  fontSize: FONT_SIZE,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
};

export const DARK_THEME = {
  mode: 'dark',
  primary: '#D4AF37', // Metallic Gold
  primaryDark: '#8E7324',
  accent: '#FFFFFF',
  background: '#0F0F0F', // Rich Black
  surface: '#1A1A1A', // Dark Gray
  surfaceHighlight: '#2A2A2A', // Lighter Dark Gray
  text: '#F3F4F6', // Gray 100
  textSecondary: '#9CA3AF', // Gray 400
  textInverse: '#111827',
  error: '#EF4444',
  inputBg: '#272727',
  border: '#374151', // Gray 700
  overlay: 'rgba(255,255,255,0.05)',

  ...COMMON_COLORS,
  spacing: SPACING,
  fontSize: FONT_SIZE,
  borderRadius: BORDER_RADIUS,
  shadows: {
    ...SHADOWS,
    strong: {
      shadowColor: "#D4AF37",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    }
  },
};
