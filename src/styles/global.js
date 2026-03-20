import { StyleSheet, Platform } from 'react-native';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from './theme';

// Generador de estilos globales que pueden usar valores dinámicos si es necesario
// Aunque StyleSheet.create no acepta funciones, exportamos un objeto fijo basado en los tokens
export const globalStyles = StyleSheet.create({
  // --- LAYOUT & CONTENEDORES ---
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // --- ESPACIADOS (Márgenes y Paddings) ---
  m_sm: { margin: SPACING.sm },
  m_md: { margin: SPACING.md },
  mb_sm: { marginBottom: SPACING.sm },
  mb_md: { marginBottom: SPACING.md },
  mb_lg: { marginBottom: SPACING.lg },
  mt_md: { marginTop: SPACING.md },
  mt_lg: { marginTop: SPACING.lg },
  
  p_sm: { padding: SPACING.sm },
  p_md: { padding: SPACING.md },
  p_lg: { padding: SPACING.lg },
  
  // --- TIPOGRAFÍA ---
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZE.md,
  },
  textSmall: {
    fontSize: FONT_SIZE.sm,
  },
  
  // --- INPUTS & FORMULARIOS ---
  input: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  
  // --- BOTONES ---
  button: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  buttonRound: {
    height: 50,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  
  // --- TARJETAS & SOMBRAS ---
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  shadowLg: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
});
