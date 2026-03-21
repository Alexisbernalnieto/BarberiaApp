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
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderBottomWidth: 1,
      borderBottomColor: 'var(--glass-border)',
      zIndex: 10,
    } as ViewStyle,
    progressTrack: {
      height: 3,
      backgroundColor: 'rgba(255,255,255,0.06)',
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
      backgroundColor: 'var(--gold)',
      ...Platform.select({
        web: {
          backgroundImage: 'linear-gradient(90deg, #D4AF37, #F4D03F)',
        } as any,
      }),
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
      backgroundColor: 'rgba(255,255,255,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'var(--glass-border)',
    } as ViewStyle,
    stepCircleActive: {
      backgroundColor: 'var(--gold)',
      borderColor: 'var(--gold)',
    } as ViewStyle,
    stepCircleCurrent: {
      backgroundColor: 'var(--gold)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 4,
      transform: [{ scale: 1.15 }],
    } as ViewStyle,
    stepTitle: {
      color: 'var(--text-muted)',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    } as TextStyle,
    stepTitleActive: {
      color: 'var(--gold)',
    } as TextStyle,

    // === CONTENT ===
    contentContainer: {
      flex: 1,
    } as ViewStyle,
    stepContent: {
      padding: isMobile ? 20 : 48,
      paddingBottom: 120,
      alignItems: 'center',
    } as ViewStyle,
    stepHeader: {
      fontSize: isMobile ? 22 : 28,
      fontWeight: '800',
      color: '#FFF',
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
      backgroundColor: 'var(--bg-card)',
      padding: 32,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'var(--glass-border)',
      alignItems: 'center',
      marginBottom: 10,
      position: 'relative',
      overflow: 'hidden',
    } as ViewStyle,
    activeBranchCard: {
      borderColor: 'var(--gold)',
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
    } as ViewStyle,
    branchIcon: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.04)',
    } as ViewStyle,
    activeIconBg: {
      backgroundColor: 'rgba(212, 175, 55, 0.12)',
    } as ViewStyle,
    branchName: {
      color: '#FFF',
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
      letterSpacing: 0.5,
    } as TextStyle,
    branchAddress: {
      color: 'var(--text-secondary)',
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 20,
    } as TextStyle,
    checkBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: 'var(--gold)',
      borderRadius: 50,
      padding: 4,
    } as ViewStyle,

    // === SERVICE CARDS ===
    serviceCard: {
      width: isMobile ? '100%' : '48%',
      backgroundColor: 'var(--bg-card)',
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'var(--glass-border)',
      marginBottom: 10,
    } as ViewStyle,
    activeServiceCard: {
      borderColor: 'var(--gold)',
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
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
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 4,
    } as TextStyle,
    serviceDuration: {
      color: 'var(--text-muted)',
      fontSize: 12,
      fontWeight: '500',
    } as TextStyle,
    servicePrice: {
      color: 'var(--gold)',
      fontSize: 18,
      fontWeight: '800',
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
      backgroundColor: 'var(--bg-card)',
      padding: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'var(--glass-border)',
      alignItems: 'center',
    } as ViewStyle,
    activeBarberCard: {
      borderColor: 'var(--gold)',
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
    } as ViewStyle,
    avatarBig: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    } as ViewStyle,
    activeAvatarBig: {
      backgroundColor: 'var(--gold)',
    } as ViewStyle,
    barberName: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '700',
      marginTop: 8,
      textAlign: 'center',
    } as TextStyle,
    avatarTextBig: {
      fontSize: 30,
      fontWeight: '800',
      color: 'var(--text-muted)',
    } as TextStyle,

    // === CALENDAR & TIME ===
    calendarContainer: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: 'var(--bg-card)',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: 'var(--glass-border)',
      marginBottom: 28,
    } as ViewStyle,
    timeSection: {
      width: '100%',
      alignItems: 'center',
    } as ViewStyle,
    subLabel: {
      color: 'var(--text-muted)',
      fontSize: 12,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      fontWeight: '700',
    } as TextStyle,
    durationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      marginBottom: 20,
    } as ViewStyle,
    durationText: {
      color: 'var(--text-secondary)',
      fontSize: 13,
      fontWeight: '600',
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
      borderColor: 'var(--glass-border)',
      backgroundColor: 'var(--bg-card)',
      minWidth: 88,
      alignItems: 'center',
    } as ViewStyle,
    activeSlot: {
      borderColor: 'var(--gold)',
      backgroundColor: 'var(--gold)',
    } as ViewStyle,
    disabledSlot: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderColor: 'transparent',
      opacity: 0.4,
    } as ViewStyle,
    timeText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '600',
    } as TextStyle,

    // === CONFIRM TICKET ===
    ticketCard: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: 'var(--bg-card)',
      borderRadius: 20,
      marginBottom: 20,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.12)',
    } as ViewStyle,
    ticketHeader: {
      backgroundColor: 'rgba(212, 175, 55, 0.06)',
      padding: 28,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: 'var(--glass-border)',
      borderStyle: 'dashed',
    } as ViewStyle,
    ticketTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: 'var(--gold)',
      letterSpacing: 3,
    } as TextStyle,
    ticketSubtitle: {
      color: 'var(--text-muted)',
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
      color: 'var(--text-muted)',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    } as TextStyle,
    ticketValue: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'right',
    } as TextStyle,
    dashedDivider: {
      height: 1,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.2)',
      borderStyle: 'dashed',
      marginVertical: 20,
      borderRadius: 1,
    } as ViewStyle,
    ticketFooter: {
      alignItems: 'center',
    } as ViewStyle,
    totalLabel: {
      color: 'var(--text-muted)',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 4,
      textTransform: 'uppercase',
    } as TextStyle,
    totalPrice: {
      fontSize: 26,
      fontWeight: '800',
      color: 'var(--gold)',
    } as TextStyle,
    paymentNote: {
      color: 'var(--text-muted)',
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 20,
      textAlign: 'center',
      opacity: 0.6,
    } as TextStyle,

    // === FOOTER ACTIONS ===
    footerActions: {
      flexDirection: 'row',
      padding: 16,
      paddingHorizontal: isMobile ? 16 : 40,
      backgroundColor: 'rgb(15,15,15)',
      borderTopWidth: 1,
      borderTopColor: 'rgba(212, 175, 55, 0.2)',
      justifyContent: 'space-between',
      gap: 12,
      zIndex: 100,
      position: isMobile ? 'relative' : 'relative', // Flex handles it now
      ...Platform.select({
        web: {
          boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
        } as any,
      }),
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
      borderColor: 'var(--glass-border)',
    } as ViewStyle,
    backBtnText: {
      color: '#FFF',
      fontWeight: '700',
      letterSpacing: 0.5,
    } as TextStyle,
    nextBtn: {
      backgroundColor: 'var(--gold)',
    } as ViewStyle,
    nextBtnText: {
      color: '#000',
      fontWeight: '800',
      letterSpacing: 1,
    } as TextStyle,
    confirmBtn: {
      backgroundColor: '#10B981',
    } as ViewStyle,
    confirmBtnText: {
      color: '#FFF',
      fontWeight: '800',
      letterSpacing: 1,
    } as TextStyle,
    disabledBtn: {
      opacity: 0.4,
    } as ViewStyle,

    // === EXIT MODAL ===
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    } as ViewStyle,
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: 'rgb(20, 20, 20)',
      borderRadius: 24,
      padding: 32,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.2)',
      alignItems: 'center',
      ...Platform.select({
          web: {
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }
      })
    } as ViewStyle,
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    } as ViewStyle,
    modalTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFF',
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: 0.5,
    } as TextStyle,
    modalMessage: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.6)',
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
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    } as ViewStyle,
    confirmModalBtn: {
      backgroundColor: '#EF4444',
    } as ViewStyle,
    modalBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    } as TextStyle,
  });
