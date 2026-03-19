import { StyleSheet, Platform } from 'react-native';

export const getSplitStyles = (COLORS, isMobile) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: '#080808',
      minHeight: '100vh',
    },
    themeToggle: {
      position: 'absolute',
      top: 30,
      right: 30,
      zIndex: 50,
      padding: 12,
      borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        },
      }),
    },

    // === LEFT BRAND SIDE (Desktop) ===
    brandSide: {
      flex: 1.2,
      backgroundColor: '#080808',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    brandOverlay: {
      ...StyleSheet.absoluteFillObject,
      // Radial gradient effect via layered views
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    decoCircle: {
      position: 'absolute',
      width: 800,
      height: 800,
      borderRadius: 400,
      borderWidth: 1,
      top: -200,
      left: -200,
      opacity: 0.15,
    },
    decoCircleSmall: {
      position: 'absolute',
      width: 500,
      height: 500,
      borderRadius: 250,
      bottom: -150,
      right: -150,
      opacity: 0.08,
    },
    brandContent: {
      zIndex: 10,
      alignItems: 'center',
      padding: 60,
      maxWidth: 500,
    },
    brandTitle: {
      color: COLORS.primary,
      fontSize: 56,
      fontWeight: '900',
      letterSpacing: 6,
      marginBottom: 4,
      textShadowColor: 'rgba(212, 175, 55, 0.3)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 20,
    },
    brandSubtitle: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
      textTransform: 'uppercase',
      letterSpacing: 8,
      fontWeight: '300',
    },
    divider: {
      width: 100,
      height: 2,
      marginVertical: 30,
      ...Platform.select({
        web: {
          background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
        },
        default: {
          backgroundColor: COLORS.primary,
        },
      }),
    },
    quote: {
      color: 'rgba(255,255,255,0.45)',
      fontStyle: 'italic',
      textAlign: 'center',
      fontSize: 15,
      maxWidth: 360,
      lineHeight: 24,
      letterSpacing: 0.5,
    },

    // === RIGHT FORM SIDE ===
    formSide: {
      flex: isMobile ? 1 : 0.8,
      maxWidth: isMobile ? '100%' : 560,
      backgroundColor: COLORS.mode === 'dark' ? '#0C0C0C' : '#F5F3EF',
      justifyContent: 'center',
      borderLeftWidth: isMobile ? 0 : 1,
      borderLeftColor: 'rgba(212, 175, 55, 0.15)',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? 24 : 48,
    },

    // === MOBILE HEADER ===
    mobileHeader: {
      alignItems: 'center',
      marginBottom: 48,
      marginTop: 20,
    },
    mobileTitle: {
      color: COLORS.primary,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: 4,
      marginTop: 16,
      textShadowColor: 'rgba(212, 175, 55, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 10,
    },

    // === FORM CARD ===
    formCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(26,26,26,0.85)' : 'rgba(255,255,255,0.98)',
      padding: isMobile ? 32 : 48,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0,0,0,0.08)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(30px)',
          boxShadow: COLORS.mode === 'dark'
            ? '0 30px 60px rgba(0,0,0,0.6), 0 0 100px rgba(212, 175, 55, 0.05)'
            : '0 20px 40px rgba(0,0,0,0.1)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.2,
          shadowRadius: 40,
          elevation: 20,
        },
      }),
    },
    formTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: COLORS.text,
      marginBottom: 6,
      letterSpacing: 1,
    },
    formSubtitle: {
      fontSize: 14,
      color: COLORS.textSecondary,
      marginBottom: 36,
      letterSpacing: 0.5,
    },

    // === INPUTS ===
    inputGroup: {
      marginBottom: 22,
    },
    label: {
      color: COLORS.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 8,
      marginLeft: 2,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.mode === 'dark' ? '#121212' : '#FFFFFF', // More solid background
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.1)',
      paddingHorizontal: 20,
      height: 60,
      overflow: 'hidden',
      ...Platform.select({
        web: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }),
    },
    input: {
      flex: 1,
      marginLeft: 14,
      color: COLORS.text,
      fontSize: 16,
      height: '100%',
      paddingVertical: Platform.OS === 'web' ? 12 : 0,
      backgroundColor: 'transparent',
      ...Platform.select({
        web: {
          outline: 'none',
          boxShadow: 'none',
        },
      }),
    },
    errorText: {
      color: COLORS.error,
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
      fontWeight: '500',
    },
    linkText: {
      color: COLORS.primary,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
    },

    // === BUTTONS ===
    primaryBtn: {
      borderRadius: 18,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 18,
      marginBottom: 32,
      backgroundColor: '#D4AF37', // Solid Luxury Gold for best contrast
      ...Platform.select({
        web: {
          background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #AA8C2C 100%)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 12px 32px rgba(212, 175, 55, 0.4)',
        },
        default: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 10,
        },
      }),
    },
    primaryBtnText: {
      color: '#000', // Black text is much better on gold
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
