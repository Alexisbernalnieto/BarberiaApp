import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  Animated, 
  Dimensions, 
  Pressable,
  Modal
} from 'react-native';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  CreditCard, 
  TrendingUp, 
  Settings, 
  LogOut,
  PlusCircle,
  MonitorPlay,
  X,
  Menu,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  COLORS: any;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, COLORS, isMobile, isOpen, onClose }) => {
  const { logout, currentUser } = useAuth();
  const { isBookingInProgress, setIsBookingInProgress } = useSidebar();
  const role = currentUser?.role;
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showExitConfirm, setShowExitConfirm] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<{type: 'tab' | 'logout', id?: string} | null>(null);

  const getRoleLabel = (r: any) => {
    if (r === 0 || r === 'admin') return 'Administrador';
    if (r === 2 || r === 'reception') return 'Recepción';
    if (r === 3 || r === 'barber') return 'Barbero';
    return 'Cliente';
  };

  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: -300, duration: 300, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start();
      }
    }
  }, [isOpen, isMobile]);

  const adminItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'walkin', label: 'Nueva Cita', icon: PlusCircle },
    { id: 'cashregister', label: 'Corte de Caja', icon: CreditCard },
    { id: 'queue', label: 'Pantalla Turnos', icon: MonitorPlay },
    { id: 'users', label: 'Usuarios y Staff', icon: Users },
    { id: 'metrics', label: 'Métricas', icon: TrendingUp },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const clientItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'book', label: 'Agendar Cita', icon: PlusCircle },
    { id: 'appointments', label: 'Mis Citas', icon: Calendar },
    { id: 'payments', label: 'Métodos de Pago', icon: CreditCard },
    { id: 'profile', label: 'Mi Perfil', icon: Users },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const barberItems = [
    { id: 'dashboard', label: 'Mi Agenda', icon: Calendar },
    { id: 'metrics', label: 'Mis Métricas', icon: TrendingUp },
    { id: 'profile', label: 'Mi Perfil', icon: Users },
  ];

  const menuItems = (role === 0 || role === 2 || role === 'admin' || role === 'reception') 
    ? adminItems 
    : (role === 3 || role === 'barber')
    ? barberItems
    : clientItems;

  const handleTabPress = (id: string) => {
    if (isBookingInProgress && activeTab === 'book' && id !== 'book') {
        setPendingAction({ type: 'tab', id });
        setShowExitConfirm(true);
        return;
    }
    setActiveTab(id);
    if (isMobile && onClose) onClose();
  };

  const handleLogoutPress = () => {
    if (isBookingInProgress && activeTab === 'book') {
        setPendingAction({ type: 'logout' });
        setShowExitConfirm(true);
        return;
    }
    logout();
  };

  const confirmExit = () => {
    setIsBookingInProgress(false);
    setShowExitConfirm(false);
    if (pendingAction?.type === 'tab' && pendingAction.id) {
        setActiveTab(pendingAction.id);
        if (isMobile && onClose) onClose();
    } else if (pendingAction?.type === 'logout') {
        logout();
    }
    setPendingAction(null);
  };

  const renderContent = () => (
    <View style={[styles.sidebarInner, { backgroundColor: COLORS.background || 'var(--bg-sidebar)' }]}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={[styles.logo, { borderColor: COLORS.primary || 'var(--gold)' }]}>
          <Text style={[styles.logoText, { color: COLORS.primary || 'var(--gold)' }]}>B</Text>
        </View>
        <Text style={styles.brandName}>EL CORONEL</Text>
        {isMobile && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={COLORS.text || "#FFF"} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleTabPress(item.id)}
              style={[
                styles.menuItem,
                isActive && styles.activeItem
              ]}
              data-sidebar-item="true"
            >
              <Icon 
                size={20} 
                color={isActive ? (COLORS.primary || 'var(--gold)') : (COLORS.textSecondary || 'var(--text-secondary)')} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text 
                style={[
                  styles.menuLabel, 
                  { color: isActive ? (COLORS.text || 'var(--text-primary)') : (COLORS.textSecondary || 'var(--text-secondary)') },
                  isActive && styles.activeLabel
                ]}
              >
                {item.label}
              </Text>
              {isActive && <View style={[styles.indicator, { backgroundColor: COLORS.primary || 'var(--gold)' }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User Info / Logout */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
             <Text style={styles.avatarInitial}>{currentUser?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>{currentUser?.name || 'Usuario'}</Text>
            <Text style={styles.userRole} numberOfLines={1}>{getRoleLabel(role)}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={handleLogoutPress}
          data-logout-btn="true"
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE CONFIRMACIÓN GLOBAL */}
      <Modal
        visible={showExitConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <AlertTriangle size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>¿Abandonar proceso?</Text>
            <Text style={styles.modalMessage}>
                Tienes una reserva en curso. Si sales ahora se perderán los datos seleccionados.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelModalBtn]} 
                onPress={() => setShowExitConfirm(false)}
              >
                <Text style={styles.modalBtnText}>CONTINUAR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmModalBtn]} 
                onPress={confirmExit}
              >
                <Text style={styles.modalBtnText}>SÍ, SALIR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (isMobile) {
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: 9999, pointerEvents: isOpen ? 'auto' : 'none' } as any]}>
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
        >
          <Animated.View 
            style={[
              styles.backdrop, 
              { opacity: fadeAnim }
            ]} 
          />
        </Pressable>
        <Animated.View 
          style={[
            styles.mobileDrawer, 
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          {renderContent()}
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.sidebarDesktop}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarDesktop: {
    width: 280,
    borderRightWidth: 1,
    borderColor: 'var(--glass-border)',
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    position: Platform.OS === 'web' ? ('fixed' as any) : 'relative',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  sidebarInner: {
    flex: 1,
    padding: 24,
  },
  mobileDrawer: {
    width: 280,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10000,
    ...Platform.select({
      web: {
        boxShadow: '20px 0 50px rgba(0,0,0,0.5)',
      },
      default: {
        elevation: 20,
      }
    }),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontWeight: '900',
    fontSize: 18,
  },
  brandName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    position: 'relative',
  },
  activeItem: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  menuLabel: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  activeLabel: {
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'var(--glass-border)',
    marginBottom: 24,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: 'var(--gold)',
    fontWeight: 'bold',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userRole: {
    color: 'var(--text-secondary)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  // EXIT MODAL STYLES (MATCHING WIZARD)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 20000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgb(20, 20, 20)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
  },
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
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  confirmModalBtn: {
    backgroundColor: '#EF4444',
  },
  modalBtnText: {
      color: '#FFF',
      fontWeight: '700',
      fontSize: 14,
  },
});

export default Sidebar;
