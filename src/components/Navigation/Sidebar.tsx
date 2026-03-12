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
  Pressable 
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
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const role = currentUser?.role;
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    { id: 'finance', label: 'Corte de Caja', icon: CreditCard },
    { id: 'queue', label: 'Pantalla Turnos', icon: MonitorPlay },
    { id: 'users', label: 'Usuarios y Staff', icon: Users },
    { id: 'metrics', label: 'Métricas', icon: TrendingUp },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const clientItems = [
    { id: 'book', label: 'Agendar Cita', icon: PlusCircle },
    { id: 'appointments', label: 'Mis Citas', icon: Calendar },
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
    setActiveTab(id);
    if (isMobile && onClose) onClose();
  };

  const renderContent = () => (
    <View style={[styles.sidebarInner, { backgroundColor: 'var(--bg-sidebar)' }]}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={[styles.logo, { borderColor: 'var(--gold)' }]}>
          <Text style={[styles.logoText, { color: 'var(--gold)' }]}>B</Text>
        </View>
        <Text style={styles.brandName}>EL CORONEL</Text>
        {isMobile && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#FFF" />
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
                color={isActive ? 'var(--gold)' : 'var(--text-secondary)'} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text 
                style={[
                  styles.menuLabel, 
                  { color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' },
                  isActive && styles.activeLabel
                ]}
              >
                {item.label}
              </Text>
              {isActive && <View style={[styles.indicator, { backgroundColor: 'var(--gold)' }]} />}
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
            <Text style={styles.userRole} numberOfLines={1}>{currentUser?.role}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={logout}
          data-logout-btn="true"
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
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
});

export default Sidebar;
