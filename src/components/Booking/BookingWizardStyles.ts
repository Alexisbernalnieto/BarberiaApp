import { StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';

export const getBookingWizardStyles = (COLORS: any, isMobile: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    inner: {
      flex: 1,
      width: '100%',
      maxWidth: isMobile ? '100%' : 1100,
      alignSelf: 'center',
    },
    rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    // === PROGRESS BAR ===
    progressContainer: {
      paddingVertical: 24,
      paddingHorizontal: isMobile ? 16 : 40,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      zIndex: 10,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        } as any
      })
    } as ViewStyle,
    progressTrack: {
      height: 3,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      position: 'absolute',
      top: 40,
      left: 50,
      right: 50,
      zIndex: 0,
      borderRadius: 2,
    } as ViewStyle,
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: COLORS.primary,
    } as ViewStyle,
    stepsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 1,
    } as ViewStyle,
    stepWrapper: {
      alignItems: 'center',
      width: isMobile ? 56 : 80,
    } as ViewStyle,
    stepCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
    } as ViewStyle,
    stepCircleActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    } as ViewStyle,
    stepCircleCurrent: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 4,
      transform: [{ scale: 1.15 }],
    } as ViewStyle,
    stepTitle: {
      color: COLORS.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    } as TextStyle,
    stepTitleActive: {
      color: COLORS.primary,
    } as TextStyle,

    // === CONTENT ===
    contentContainer: {
      flex: 1,
      minHeight: isMobile ? 450 : 500,
      maxHeight: isMobile ? 800 : 650, 
      overflow: 'hidden',
    } as ViewStyle,
    stepContent: {
      padding: isMobile ? 20 : 32,
      paddingBottom: isMobile ? 40 : 60,
      alignItems: 'center',
    } as ViewStyle,
    stepHeader: {
      fontSize: isMobile ? 22 : 28,
      fontWeight: '900',
      color: COLORS.text,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: 1,
    } as TextStyle,

    // === BRANCH CARDS ===
    gridContainer: {
      gap: 20,
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      width: '100%',
      marginTop: 24,
    } as ViewStyle,
    branchCard: {
      width: isMobile ? '100%' : '46%',
      backgroundColor: COLORS.surface,
      padding: 32,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: 'center',
      marginBottom: 10,
      position: 'relative',
      overflow: 'hidden',
    } as ViewStyle,
    activeBranchCard: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary + '15',
    } as ViewStyle,
    branchIcon: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    } as ViewStyle,
    activeIconBg: {
      backgroundColor: COLORS.primary + '20',
    } as ViewStyle,
    branchName: {
      color: COLORS.text,
      fontSize: 20,
      fontWeight: '900',
      marginBottom: 8,
      letterSpacing: 0.5,
    } as TextStyle,
    branchAddress: {
      color: COLORS.textSecondary,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 20,
    } as TextStyle,
    checkBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: COLORS.primary,
      borderRadius: 50,
      padding: 4,
    } as ViewStyle,

    // === SERVICE CARDS ===
    serviceCard: {
      width: isMobile ? '100%' : '48%',
      backgroundColor: COLORS.surface,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 10,
    } as ViewStyle,
    activeServiceCard: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary + '15',
    } as ViewStyle,
    serviceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,
    serviceInfo: {
      flex: 1,
    } as ViewStyle,
    serviceName: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 4,
    } as TextStyle,
    serviceDuration: {
      color: COLORS.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    } as TextStyle,
    servicePrice: {
      color: COLORS.primary,
      fontSize: 18,
      fontWeight: '900',
    } as TextStyle,

    // === BARBER CARDS ===
    barbersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 24,
      justifyContent: 'center',
      marginTop: 24,
    } as ViewStyle,
    barberCard: {
      width: isMobile ? '43%' : 190,
      backgroundColor: COLORS.surface,
      padding: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: 'center',
    } as ViewStyle,
    activeBarberCard: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary + '15',
    } as ViewStyle,
    avatarBig: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    } as ViewStyle,
    activeAvatarBig: {
      backgroundColor: COLORS.primary,
    } as ViewStyle,
    barberName: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 8,
      textAlign: 'center',
    } as TextStyle,
    avatarTextBig: {
      fontSize: 30,
      fontWeight: '900',
      color: COLORS.textMuted,
    } as TextStyle,

    // === CALENDAR & TIME ===
    calendarContainer: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: COLORS.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 28,
    } as ViewStyle,
    timeSection: {
      width: '100%',
      alignItems: 'center',
    } as ViewStyle,
    subLabel: {
      color: COLORS.textMuted,
      fontSize: 12,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      fontWeight: '800',
    } as TextStyle,
    durationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      marginBottom: 20,
    } as ViewStyle,
    durationText: {
      color: COLORS.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    } as TextStyle,
    slotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    } as ViewStyle,
    timeSlot: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      minWidth: 88,
      alignItems: 'center',
    } as ViewStyle,
    activeSlot: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary,
    } as ViewStyle,
    disabledSlot: {
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      borderColor: 'transparent',
      opacity: 0.4,
    } as ViewStyle,
    timeText: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '700',
    } as TextStyle,

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
      borderColor: COLORS.primary + '33',
    } as ViewStyle,
    ticketHeader: {
      backgroundColor: COLORS.primary + '10',
      padding: 28,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      borderStyle: 'dashed',
    } as ViewStyle,
    ticketTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: COLORS.primary,
      letterSpacing: 3,
    } as TextStyle,
    ticketSubtitle: {
      color: COLORS.textMuted,
      fontSize: 10,
      letterSpacing: 2,
      marginTop: 4,
    } as TextStyle,
    ticketContent: {
      padding: 28,
    } as ViewStyle,
    ticketRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
      alignItems: 'center',
    } as ViewStyle,
    ticketLabel: {
      color: COLORS.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    } as TextStyle,
    ticketValue: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'right',
    } as TextStyle,
    dashedDivider: {
      height: 1,
      borderWidth: 1,
      borderColor: COLORS.primary + '4D', // approx 0.3 opacity
      borderStyle: 'dashed',
      marginVertical: 20,
      borderRadius: 1,
    } as ViewStyle,
    ticketFooter: {
      alignItems: 'center',
    } as ViewStyle,
    totalLabel: {
      color: COLORS.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 4,
      textTransform: 'uppercase',
    } as TextStyle,
    totalPrice: {
      fontSize: 26,
      fontWeight: '900',
      color: COLORS.primary,
    } as TextStyle,
    paymentNote: {
      color: COLORS.textMuted,
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 20,
      textAlign: 'center',
      opacity: 0.7,
    } as TextStyle,

    // === FOOTER ACTIONS ===
    footerActions: {
      flexDirection: 'row',
      padding: 20,
      paddingHorizontal: isMobile ? 20 : 40,
      backgroundColor: COLORS.mode === 'dark' ? COLORS.surface : '#F1F5F9', // Slate 50/100 for subtle contrast
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      zIndex: 100,
      position: 'relative', 
    } as ViewStyle,
    actionBtn: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    } as ViewStyle,
    backBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: COLORS.border,
      maxWidth: isMobile ? 100 : 140,
    } as ViewStyle,
    backBtnText: {
      color: COLORS.textSecondary,
      fontWeight: '800',
      letterSpacing: 0.5,
    } as TextStyle,
    nextBtn: {
      backgroundColor: COLORS.primary,
    } as ViewStyle,
    nextBtnText: {
      color: '#000',
      fontWeight: '900',
      letterSpacing: 1,
    } as TextStyle,
    confirmBtn: {
      backgroundColor: '#10B981',
    } as ViewStyle,
    confirmBtnText: {
      color: '#FFF',
      fontWeight: '900',
      letterSpacing: 1,
    } as TextStyle,
    disabledBtn: {
      opacity: 0.3,
    } as ViewStyle,

    // === EXIT MODAL ===
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    } as ViewStyle,
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: COLORS.surface,
      borderRadius: 24,
      padding: 32,
      borderWidth: 1,
      borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : COLORS.border,
      alignItems: 'center',
    } as ViewStyle,
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    } as ViewStyle,
    modalTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: COLORS.text,
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: 0.5,
    } as TextStyle,
    modalMessage: {
      fontSize: 15,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    } as TextStyle,
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    } as ViewStyle,
    modalBtn: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    cancelModalBtn: {
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderWidth: 1,
      borderColor: COLORS.border,
    } as ViewStyle,
    confirmModalBtn: {
      backgroundColor: '#EF4444',
    } as ViewStyle,
    modalBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 0.5,
    } as TextStyle,
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
      gap: 12,
      marginTop: 8,
    } as ViewStyle,
    input: {
      flex: 1,
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '600',
    } as TextStyle,
  });
