import { StyleSheet, Platform } from 'react-native';

export const getBookingWizardStyles = (COLORS, isMobile) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    inner: {
      width: '100%',
      maxWidth: isMobile ? '100%' : 1100,
      alignSelf: 'center',
    },
    rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    // === PROGRESS BAR ===
    progressContainer: {
      paddingVertical: 24,
      paddingHorizontal: isMobile ? 16 : 40,
      backgroundColor: COLORS.surface,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      zIndex: 10,
    },
    progressTrack: {
      height: 3,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      position: 'absolute',
      top: 40,
      left: 50,
      right: 50,
      zIndex: 0,
      borderRadius: 2,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      ...Platform.select({
        web: {
          background: 'linear-gradient(90deg, #D4AF37, #F4D03F)',
          transition: 'width 0.4s ease',
        },
        default: {
          backgroundColor: COLORS.primary,
        },
      }),
    },
    stepsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 1,
    },
    stepWrapper: {
      alignItems: 'center',
      width: isMobile ? 56 : 80,
    },
    stepCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 2,
      borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    stepCircleActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    stepCircleCurrent: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.background,
      borderWidth: 3,
      transform: [{ scale: 1.15 }],
      ...Platform.select({
        web: {
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
        },
        default: {
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
        },
      }),
    },
    stepTitle: {
      color: COLORS.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    stepTitleActive: {
      color: COLORS.primary,
    },

    // === CONTENT ===
    contentContainer: {
      width: '100%',
    },
    stepContent: {
      padding: isMobile ? 12 : 32,
      paddingBottom: 40,
      alignItems: 'center',
    },
    stepHeader: {
      fontSize: isMobile ? 22 : 28,
      fontWeight: '800',
      color: COLORS.text,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: 1,
    },

    // === BRANCH CARDS ===
    gridContainer: {
      gap: 20,
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      width: '100%',
      marginTop: 24,
    },
    branchCard: {
      width: isMobile ? '100%' : '46%',
      backgroundColor: COLORS.surface,
      padding: 32,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      marginBottom: 10,
      position: 'relative',
      overflow: 'hidden',
      ...Platform.select({
        web: {
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
          boxShadow: COLORS.mode === 'dark' ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.05)',
        },
        default: COLORS.shadows?.medium || {},
      }),
    },
    activeBranchCard: {
      borderColor: COLORS.primary,
      ...Platform.select({
        web: {
          boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)',
          transform: [{ scale: 1.02 }],
        },
        default: {
          ...(COLORS.shadows?.strong || {}),
          transform: [{ scale: 1.02 }],
        },
      }),
    },
    branchIcon: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    },
    activeIconBg: {
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.12)' : 'rgba(212, 175, 55, 0.08)',
    },
    branchName: {
      color: COLORS.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    branchAddress: {
      color: COLORS.textSecondary,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 20,
    },
    checkBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: COLORS.primary,
      borderRadius: 50,
      padding: 4,
    },

    // === SERVICE CARDS ===
    serviceCard: {
      width: isMobile ? '100%' : '48%',
      backgroundColor: COLORS.surface,
      padding: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(0,0,0,0.05)',
      marginBottom: 12,
      ...Platform.select({
        web: {
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: COLORS.mode === 'dark' ? '0 4px 15px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
        },
        default: COLORS.shadows?.light || {},
      }),
    },
    activeServiceCard: {
      borderColor: COLORS.primary,
      ...Platform.select({
        web: {
          boxShadow: '0 4px 20px rgba(212, 175, 55, 0.15)',
        },
        default: COLORS.shadows?.medium || {},
      }),
    },
    serviceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 4,
    },
    serviceDuration: {
      color: COLORS.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    servicePrice: {
      color: COLORS.primary,
      fontSize: 18,
      fontWeight: '800',
    },
    activeText: {
      color: COLORS.primary,
    },

    // === BARBER CARDS ===
    barbersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 24,
      justifyContent: 'center',
      marginTop: 24,
    },
    barberCard: {
      width: isMobile ? '43%' : 190,
      backgroundColor: COLORS.surface,
      padding: 24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      ...Platform.select({
        web: {
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
          boxShadow: COLORS.mode === 'dark' ? '0 8px 25px rgba(0,0,0,0.35)' : '0 4px 15px rgba(0,0,0,0.06)',
        },
        default: COLORS.shadows?.medium || {},
      }),
    },
    activeBarberCard: {
      borderColor: COLORS.primary,
      ...Platform.select({
        web: {
          boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)',
        },
        default: COLORS.shadows?.medium || {},
      }),
    },
    avatarBig: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    activeAvatarBig: {
      ...Platform.select({
        web: {
          background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
        },
        default: {
          backgroundColor: COLORS.primary,
        },
      }),
    },
    barberName: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 8,
      textAlign: 'center',
    },
    avatarTextBig: {
      fontSize: 30,
      fontWeight: '800',
      color: COLORS.textSecondary,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      marginTop: 8,
    },
    ratingText: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.text,
    },

    // === CALENDAR & TIME ===
    calendarContainer: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: COLORS.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      marginBottom: 28,
      ...Platform.select({
        web: {
          boxShadow: COLORS.mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
        },
        default: COLORS.shadows?.light || {},
      }),
    },
    calendar: {
      borderRadius: 16,
    },
    timeSection: {
      width: '100%',
      alignItems: 'center',
    },
    subLabel: {
      color: COLORS.textSecondary,
      fontSize: 12,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      fontWeight: '700',
    },
    durationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      marginBottom: 20,
    },
    durationText: {
      color: COLORS.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    slotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    timeSlot: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      backgroundColor: COLORS.surface,
      minWidth: 88,
      alignItems: 'center',
      ...Platform.select({
        web: {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        },
      }),
    },
    activeSlot: {
      borderColor: COLORS.primary,
      ...Platform.select({
        web: {
          background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
          boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
        },
        default: {
          backgroundColor: COLORS.primary,
        },
      }),
    },
    disabledSlot: {
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      borderColor: 'transparent',
      opacity: 0.4,
    },
    timeText: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '600',
    },
    hintText: {
      color: COLORS.textSecondary,
      fontSize: 13,
      marginTop: 20,
      fontStyle: 'italic',
    },
    noSlotsContainer: {
      alignItems: 'center',
      marginTop: 24,
    },
    noSlotsText: {
      color: COLORS.textSecondary,
      marginTop: 8,
      fontSize: 14,
    },

    // === CONFIRM TICKET ===
    ticketCard: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: COLORS.surface,
      borderRadius: 20,
      marginBottom: 20,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.12)' : 'rgba(0,0,0,0.06)',
      ...Platform.select({
        web: {
          boxShadow: COLORS.mode === 'dark'
            ? '0 20px 50px rgba(0,0,0,0.4), 0 0 80px rgba(212, 175, 55, 0.05)'
            : '0 10px 40px rgba(0,0,0,0.1)',
        },
        default: COLORS.shadows?.strong || {},
      }),
    },
    ticketHeader: {
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.06)' : 'rgba(212, 175, 55, 0.04)',
      padding: 28,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      borderStyle: 'dashed',
    },
    ticketTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: COLORS.primary,
      letterSpacing: 3,
    },
    ticketSubtitle: {
      fontSize: 10,
      color: COLORS.textSecondary,
      letterSpacing: 4,
      fontWeight: '600',
      marginTop: 4,
    },
    ticketContent: {
      padding: 28,
    },
    ticketRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
      alignItems: 'center',
    },
    ticketLabel: {
      color: COLORS.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    ticketValue: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'right',
    },
    dashedDivider: {
      height: 1,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderStyle: 'dashed',
      opacity: 0.5,
    },
    ticketFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: COLORS.text,
      letterSpacing: 0.5,
    },
    totalPrice: {
      fontSize: 26,
      fontWeight: '800',
      color: COLORS.primary,
    },
    ticketHole: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: COLORS.background,
    },
    paymentNote: {
      color: COLORS.textSecondary,
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'center',
    },

    // === FOOTER ACTIONS ===
    footerActions: {
      flexDirection: 'row',
      padding: 20,
      paddingHorizontal: isMobile ? 20 : 40,
      backgroundColor: 'transparent',
      borderTopWidth: 1,
      borderTopColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      justifyContent: 'space-between',
      gap: 16,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...Platform.select({
        web: {
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        },
      }),
    },
    backBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    backBtnText: {
      color: COLORS.text,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    nextBtn: {
      ...Platform.select({
        web: {
          backgroundColor: COLORS.primary,
          backgroundImage: 'linear-gradient(135deg, #D4AF37 0%, #F1C40F 50%, #B8860B 100%)',
          boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3), 0 2px 6px rgba(0,0,0,0.2)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          borderWidth: 0,
        },
        default: {
          backgroundColor: COLORS.primary,
          ...(COLORS.shadows?.medium || {}),
        },
      }),
    },
    nextBtnText: {
      color: '#000',
      fontWeight: '900',
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontSize: 15,
      ...Platform.select({
          web: {
              textShadow: '0 1px 1px rgba(255,255,255,0.3)',
          }
      })
    },
    confirmBtn: {
      ...Platform.select({
        web: {
          backgroundImage: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)',
          boxShadow: '0 8px 16px rgba(46, 204, 113, 0.25), 0 12px 24px rgba(0,0,0,0.3)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          borderWidth: 0,
          transform: 'scale(1.02)',
        },
        default: {
          backgroundColor: COLORS.success,
          ...(COLORS.shadows?.medium || {}),
        },
      }),
    },
    confirmBtnText: {
      color: '#FFF',
      fontWeight: '900',
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontSize: 15,
      ...Platform.select({
          web: {
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }
      })
    },
    disabledBtn: {
      opacity: 0.4,
      backgroundColor: COLORS.disabled || '#999',
      borderColor: COLORS.disabled || '#999',
      ...Platform.select({
        web: {
          boxShadow: 'none',
          background: COLORS.disabled || '#999',
        },
      }),
    },
    input: {
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      paddingVertical: 6,
      fontSize: 16,
      color: COLORS.text,
    },
  });
