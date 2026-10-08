export const LiquidTheme = {
  colors: {
    // Canvas & background
    canvas: '#07090e',
    canvasElevated: '#0d111a',
    canvasTranslucent: 'rgba(7, 9, 14, 0.75)',

    // Glass surfaces
    glass1: 'rgba(255, 255, 255, 0.035)',
    glass2: 'rgba(255, 255, 255, 0.065)',
    glass3: 'rgba(255, 255, 255, 0.11)',
    glassCard: 'rgba(14, 18, 27, 0.65)',
    glassCardElevated: 'rgba(20, 26, 39, 0.75)',
    glassOverlay: 'rgba(5, 7, 12, 0.85)',

    // Specular Rim & Borders
    borderHairline: 'rgba(255, 255, 255, 0.08)',
    borderMedium: 'rgba(255, 255, 255, 0.14)',
    borderSpecular: 'rgba(255, 255, 255, 0.24)',
    borderHighlight: 'rgba(255, 255, 255, 0.40)',

    // Accents (iOS Vibrant Tones)
    cyan: '#38bdf8',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#a855f7',
    emerald: '#34d399',
    amber: '#fbbf24',
    rose: '#f43f5e',

    // Text hierarchy (WCAG AAA compliant on dark glass)
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textHighlight: '#ffffff',

    // Lesson Types
    typeLecture: '#38bdf8',
    typePractice: '#34d399',
    typeLab: '#a855f7',
    typeExam: '#f43f5e',
    typeSeminar: '#fbbf24',
  },

  blur: {
    soft: 20,
    medium: 35,
    dense: 60,
  },

  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    full: 9999,
  },

  shadows: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 4,
    },
    floating: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.65,
      shadowRadius: 24,
      elevation: 10,
    },
    glowCyan: {
      shadowColor: '#38bdf8',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    },
    glowViolet: {
      shadowColor: '#a855f7',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
