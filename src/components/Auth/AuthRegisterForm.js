import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AuthRegisterForm({
  styles,
  COLORS,
  name,
  registerEmail,
  registerPassword,
  confirmPassword,
  registerEmailError,
  registerPasswordError,
  confirmPasswordError,
  onChangeName,
  onChangeRegisterEmail,
  onChangeRegisterPassword,
  onChangeConfirmPassword,
  onSubmit,
  onToggleMode,
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Crear Cuenta</Text>
      <Text style={styles.formSubtitle}>Únete a la experiencia premium</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre Completo</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons
            name="account-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor={COLORS.disabled}
            value={name}
            onChangeText={onChangeName}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <View
          style={[
            styles.inputWrapper,
            registerEmailError ? { borderColor: COLORS.error } : {},
          ]}
        >
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            placeholderTextColor={COLORS.disabled}
            value={registerEmail}
            onChangeText={onChangeRegisterEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        {registerEmailError ? (
          <Text style={styles.errorText}>{registerEmailError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <View
          style={[
            styles.inputWrapper,
            registerPasswordError ? { borderColor: COLORS.error } : {},
          ]}
        >
          <MaterialCommunityIcons
            name="lock-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="8+ caracteres"
            placeholderTextColor={COLORS.disabled}
            secureTextEntry
            value={registerPassword}
            onChangeText={onChangeRegisterPassword}
          />
        </View>
        {registerPasswordError ? (
          <Text style={styles.errorText}>{registerPasswordError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmar Contraseña</Text>
        <View
          style={[
            styles.inputWrapper,
            confirmPasswordError ? { borderColor: COLORS.error } : {},
          ]}
        >
          <MaterialCommunityIcons
            name="lock-check-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="Repite la contraseña"
            placeholderTextColor={COLORS.disabled}
            secureTextEntry
            value={confirmPassword}
            onChangeText={onChangeConfirmPassword}
          />
        </View>
        {confirmPasswordError ? (
          <Text style={styles.errorText}>{confirmPasswordError}</Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>REGISTRARSE</Text>
      </TouchableOpacity>

      <View style={styles.footerRow}>
        <Text style={{ color: COLORS.textSecondary }}>¿Ya tienes cuenta? </Text>
        <TouchableOpacity onPress={onToggleMode}>
          <Text style={[styles.linkText, { fontWeight: 'bold' }]}>
            Inicia Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

