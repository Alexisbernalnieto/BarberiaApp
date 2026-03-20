import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { User, Phone, Mail, Moon, Sun, LogOut, ChevronRight, Bell } from 'lucide-react';

export default function UserProfile({ user, COLORS, onLogout, toggleTheme, isDarkMode }: any) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.text }]}>Mi Perfil</Text>
        <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Personaliza tu experiencia Coronel</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0,0,0,0.06)' }]}>
         <View style={[styles.avatarLarge, { backgroundColor: COLORS.primary + '20' }]}>
            <Text style={[styles.avatarInitial, { color: COLORS.primary }]}>{name.charAt(0) || 'U'}</Text>
         </View>
         <View style={styles.form}>
            <View style={styles.inputGroup}>
               <Text style={[styles.label, { color: COLORS.textSecondary }]}>NOMBRE COMPLETO</Text>
               <View style={[styles.inputWrapper, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}>
                  <User size={18} color={COLORS.textSecondary} />
                  <TextInput 
                    style={[styles.input, { color: COLORS.text }]} 
                    value={name} 
                    onChangeText={setName} 
                    placeholder="Tu nombre"
                    placeholderTextColor={COLORS.textSecondary + '60'}
                  />
               </View>
            </View>

            <View style={styles.inputGroup}>
               <Text style={[styles.label, { color: COLORS.textSecondary }]}>TELÉFONO</Text>
               <View style={[styles.inputWrapper, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}>
                  <Phone size={18} color={COLORS.textSecondary} />
                  <TextInput 
                    style={[styles.input, { color: COLORS.text }]} 
                    value={phone} 
                    onChangeText={setPhone} 
                    placeholder="Escribe tu número"
                    keyboardType="phone-pad"
                    placeholderTextColor={COLORS.textSecondary + '60'}
                  />
               </View>
            </View>

            <View style={styles.inputGroup}>
               <Text style={[styles.label, { color: COLORS.textSecondary }]}>EMAIL</Text>
               <View style={[styles.inputWrapper, { opacity: 0.6, backgroundColor: COLORS.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}>
                  <Mail size={18} color={COLORS.textSecondary} />
                  <Text style={[styles.input, { color: COLORS.text }]}>{user?.email}</Text>
               </View>
               <Text style={styles.hint}>El correo no puede ser modificado</Text>
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}>
               <Text style={styles.saveBtnText}>Guardar Cambios</Text>
            </TouchableOpacity>
         </View>
      </View>

      <View style={styles.settingsSection}>
         <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Preferencias</Text>
         
         <TouchableOpacity style={[styles.settingItem, { borderBottomColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={toggleTheme}>
            <View style={styles.settingLeft}>
               <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#3B82F620' : '#EAB30820' }]}>
                  {isDarkMode ? <Moon size={18} color="#3B82F6" /> : <Sun size={18} color="#EAB308" />}
               </View>
               <View>
                  <Text style={[styles.settingLabel, { color: COLORS.text }]}>Modo de Apariencia</Text>
                  <Text style={[styles.settingSub, { color: COLORS.textSecondary }]}>{isDarkMode ? 'Oscuro' : 'Claro'}</Text>
               </View>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
         </TouchableOpacity>

         <TouchableOpacity style={[styles.settingItem, { borderBottomColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.settingLeft}>
               <View style={[styles.iconBox, { backgroundColor: '#8B5CF620' }]}>
                  <Bell size={18} color="#8B5CF6" />
               </View>
               <View>
                  <Text style={[styles.settingLabel, { color: COLORS.text }]}>Notificaciones Push</Text>
                  <Text style={[styles.settingSub, { color: COLORS.textSecondary }]}>Activadas</Text>
               </View>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
         </TouchableOpacity>

         <TouchableOpacity style={[styles.settingItem, { marginTop: 8 }]} onPress={onLogout}>
            <View style={styles.settingLeft}>
               <View style={[styles.iconBox, { backgroundColor: '#EF444420' }]}>
                  <LogOut size={18} color="#EF4444" />
               </View>
               <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Cerrar Sesión</Text>
            </View>
         </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 32, paddingBottom: 40 },
  header: { gap: 8 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, opacity: 0.8 },
  profileCard: { padding: 32, borderRadius: 24, borderWidth: 1, alignItems: 'center', gap: 32 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#D4AF37' },
  avatarInitial: { fontSize: 32, fontWeight: '900' },
  form: { width: '100%', gap: 20 },
  inputGroup: { gap: 6 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 52, borderRadius: 14, gap: 12 },
  input: { flex: 1, fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 11, color: '#888', marginLeft: 4, marginTop: 4, opacity: 0.6 },
  saveBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  settingsSection: { gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '700' },
  settingSub: { fontSize: 12, marginTop: 2 },
});
