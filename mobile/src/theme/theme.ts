import { MD3LightTheme } from 'react-native-paper';

export const appTheme = {
  ...MD3LightTheme,
  roundness: 6,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0D4D92',
    onPrimary: '#FFFFFF',
    primaryContainer: '#DCE8F6',
    onPrimaryContainer: '#0B1F3A',
    secondary: '#5C86B6',
    secondaryContainer: '#EAF1F9',
    background: '#E9F0F7',
    surface: '#FFFFFF',
    surfaceVariant: '#EFF4FA',
    outline: '#C4D1E1',
    outlineVariant: '#DAE3EF',
    error: '#DC2626',
  },
};

export const appColors = {
  page: '#E9F0F7',
  hero: '#DCE8F6',
  heroDark: '#0D4D92',
  heroDarkAlt: '#144F8A',
  textMuted: '#6C7D93',
  textSoft: '#AFC2D8',
  cardBorder: '#D9E3EE',
  successSoft: '#DFF3E9',
  warningSoft: '#FFF1CE',
  dangerSoft: '#FCE4E4',
};
