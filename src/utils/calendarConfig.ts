/**
 * Calendar Localization for Spanish
 * Using react-native-calendars LocaleConfig.
 */
import { LocaleConfig } from 'react-native-calendars';

export const configureSpanishCalendar = () => {
  LocaleConfig.locales['es'] = {
    monthNames: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    monthNamesShort: [
      'Ene.', 'Feb.', 'Mar.', 'Abr.', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Juv', 'Vie', 'Sáb'],
    today: 'Hoy'
  };

  LocaleConfig.defaultLocale = 'es';
};
