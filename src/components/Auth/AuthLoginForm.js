import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AuthLoginForm({
  styles,
  COLORS,
  email,
  password,
  emailError,
  passwordError,
  onChangeEmail,
  onChangePassword,
  onForgotPassword,
  onSubmit,
  onToggleMode,
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Bienvenido</Text>
      <Text style={styles.formSubtitle}>Ingresa a tu cuenta</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <View
          style={[
            styles.inputWrapper,
            emailError ? { borderColor: COLORS.error } : {},
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
            value={email}
            onChangeText={onChangeEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor={COLORS.primary}
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <View
          style={[
            styles.inputWrapper,
            passwordError ? { borderColor: COLORS.error } : {},
          ]}
        >
          <MaterialCommunityIcons
            name="lock-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.disabled}
            secureTextEntry
            value={password}
            onChangeText={onChangePassword}
            selectionColor={COLORS.primary}
          />
        </View>
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onForgotPassword}
        style={{ alignSelf: 'flex-end', marginBottom: 20 }}
      >
        <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>INICIAR SESIÓN</Text>
      </TouchableOpacity>

      <View style={styles.footerRow}>
        <Text style={{ color: COLORS.textSecondary }}>¿No tienes cuenta? </Text>
        <TouchableOpacity onPress={onToggleMode}>
          <Text style={[styles.linkText, { fontWeight: 'bold' }]}>
            Regístrate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

