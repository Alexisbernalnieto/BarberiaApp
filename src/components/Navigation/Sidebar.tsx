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
  LogOut,
  PlusCircle,
  MonitorPlay,
  X,
  Menu,
  AlertTriangle,
  ClipboardCheck
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
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
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
    { id: 'appointments', label: 'Control de Citas', icon: ClipboardCheck },
    { id: 'walkin', label: 'Nueva Cita', icon: PlusCircle },
    { id: 'cashregister', label: 'Corte de Caja', icon: CreditCard },
    { id: 'queue', label: 'Pantalla Turnos', icon: MonitorPlay },
    { id: 'users', label: 'Usuarios y Staff', icon: Users },
    { id: 'metrics', label: 'Métricas', icon: TrendingUp },
  ];

  const clientItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'book', label: 'Agendar Cita', icon: PlusCircle },
    { id: 'appointments', label: 'Mis Citas', icon: Calendar },
    { id: 'payments', label: 'Métodos de Pago', icon: CreditCard },
    { id: 'profile', label: 'Mi Perfil', icon: Users },
  ];

  const barberItems = [
    { id: 'dashboard', label: 'Mi Agenda', icon: Calendar },
    { id: 'metrics', label: 'Mis Métricas', icon: TrendingUp },
    { id: 'profile', label: 'Mi Perfil', icon: Users },
  ];

  const isGodAlexis = currentUser?.email?.toLowerCase() === 'alexisb.ti22@utsjr.edu.mx' || 
                      currentUser?.email?.toLowerCase() === 'alexisbn.ti22@utsjr.edu.mx' || 
                      currentUser?.email?.toLowerCase() === 'alexisbernalnieto@gmail.com' ||
                      currentUser?.name?.toLowerCase().includes('alexis');

  let baseItems;
  if (role === 0 || role === 2 || role === 'admin' || role === 'reception') {
    baseItems = adminItems;
  } else if (role === 3 || role === 'barber') {
    baseItems = barberItems;
  } else {
    baseItems = clientItems;
  }

  const menuItems = isGodAlexis
    ? [...baseItems, { id: 'admin_users_override', label: 'Gestión Roles', icon: Users }]
    : baseItems;

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
    setShowLogoutConfirm(true);
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
    <View style={[styles.sidebarInner, { backgroundColor: COLORS.sidebar || COLORS.background }]}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={[styles.logo, { borderColor: COLORS.primary }]}>
          <Text style={[styles.logoText, { color: COLORS.primary }]}>B</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brandName, { color: COLORS.mode === 'dark' ? '#FFFFFF' : COLORS.text }]}>EL CORONEL BARBÓN</Text>
          <Text style={[styles.brandSlogan, { color: COLORS.textSecondary }]}>Peluquería y Barbería de alto nivel</Text>
        </View>
        {isMobile && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={COLORS.text} />
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
                isActive && { backgroundColor: COLORS.primary + '15' }
              ]}
              data-sidebar-item="true"
            >
              <Icon 
                size={20} 
                color={isActive ? COLORS.primary : COLORS.textSecondary} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text 
                style={[
                  styles.menuLabel, 
                  { color: isActive ? COLORS.text : COLORS.textSecondary },
                  isActive && styles.activeLabel
                ]}
              >
                {item.label}
              </Text>
              {isActive && <View style={[styles.indicator, { backgroundColor: COLORS.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User Info / Logout */}
      <View style={styles.footer}>
        <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
        <View style={styles.userSection}>
          <View style={[
            styles.userAvatar, 
            { 
              backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
              borderColor: COLORS.border 
            }
          ]}>
             <Text style={[styles.avatarInitial, { color: COLORS.primary }]}>{currentUser?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: COLORS.text }]} numberOfLines={1}>{currentUser?.name || 'Usuario'}</Text>
            <Text style={[styles.userRole, { color: COLORS.textSecondary }]} numberOfLines={1}>{getRoleLabel(role)}</Text>
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

      {/* MODAL DE CONFIRMACIÓN DE SALIDA (BOOKING) */}
      <Modal
        visible={showExitConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(15, 23, 42, 0.1)' }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
              <AlertTriangle size={32} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: COLORS.text }]}>¿Abandonar proceso?</Text>
            <Text style={[styles.modalMessage, { color: COLORS.textSecondary }]}>
                Tienes una reserva en curso. Si sales ahora se perderán los datos seleccionados.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelModalBtn, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]} 
                onPress={() => setShowExitConfirm(false)}
              >
                <Text style={[styles.modalBtnText, { color: COLORS.text }]}>CONTINUAR</Text>
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

      {/* MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(15, 23, 42, 0.1)' }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <LogOut size={32} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: COLORS.text }]}>¿Cerrar Sesión?</Text>
            <Text style={[styles.modalMessage, { color: COLORS.textSecondary }]}>
                ¿Estás seguro de que deseas cerrar tu sesión actual?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelModalBtn, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]} 
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={[styles.modalBtnText, { color: COLORS.text }]}>CANCELAR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmModalBtn]} 
                onPress={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                <Text style={styles.modalBtnText}>CERRAR SESIÓN</Text>
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
    <View style={[styles.sidebarDesktop, { borderColor: COLORS.border }]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarDesktop: {
    width: 280,
    borderRightWidth: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    position: Platform.OS === 'web' ? ('fixed' as any) : 'relative',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  brandSlogan: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
    opacity: 0.8,
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
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontWeight: 'bold',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  userRole: {
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
