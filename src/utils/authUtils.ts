/**
 * Authentication Utilities
 * Includes regex patterns for validation and Firebase error mapping to Spanish.
 */

// Regex for name validation: letters, spaces, accents, at least 2 chars
export const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s]{2,}$/;

// Regex for password validation: at least one letter, one number, and one special character.
// Minimum 6 characters (Firebase default)
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;

/**
 * Maps Firebase Auth error codes to user-friendly Spanish messages.
 */
export const mapAuthError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/user-not-found':
      return 'No existe una cuenta con este correo electrónico.';
    case 'auth/wrong-password':
      return 'La contraseña es incorrecta.';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado.';
    case 'auth/operation-not-allowed':
      return 'El inicio de sesión con correo y contraseña no está habilitado.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres, incluyendo letras, números y símbolos.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, intenta más tarde.';
    case 'auth/invalid-credential':
      return 'Credenciales incorrectas. Verifica tu correo y contraseña.';
    case 'auth/requires-recent-login':
      return 'Por seguridad, debes volver a iniciar sesión antes de realizar esta acción.';
    case 'auth/internal-error':
      return 'Error interno de Firebase. Inténtalo de nuevo más tarde.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, la cuenta ha sido temporalmente bloqueada. Intenta más tarde.';
    case 'auth/invalid-credential':
      return 'Credenciales de acceso inválidas. Revisa tu correo y contraseña.';
    case 'auth/user-not-found':
      return 'No hay ninguna cuenta registrada con este correo electrónico.';
    case 'auth/wrong-password':
      return 'La contraseña ingresada es incorrecta.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico ingresado no es válido.';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado en otra cuenta.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres, letras y números.';
    case 'auth/network-request-failed':
      return 'Error de red. Verifica tu conexión a internet e intenta de nuevo.';
    case 'auth/operation-not-allowed':
      return 'Esta operación no está permitida. Contacta al soporte.';
    case 'auth/requires-recent-login':
      return 'Esta acción requiere una sesión reciente. Vuelve a ingresar.';
    case 'auth/unauthorized-continue-uri':
      return 'El dominio de retorno no está autorizado. Contacta al administrador.';
    case 'auth/missing-continue-uri':
      return 'Falta la dirección de retorno para completar la acción.';
    case 'auth/quota-exceeded':
      return 'Se ha excedido la cuota de solicitudes. Intenta más tarde.';
    default:
      return 'Ocurrió un error inesperado al procesar la solicitud.';
  }
};
