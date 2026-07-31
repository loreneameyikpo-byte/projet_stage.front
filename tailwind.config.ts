import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [],
  theme: {
    extend: {
      colors: {
  primary: '#04342C',      // teal 900 — foncé, hover, éléments actifs
  secondary: '#0F6E56',    // teal 600 — couleur d'action principale
  accent: '#378ADD',       // blue 400 — mis en avant, contraste avec le teal
  surface: '#F6FAF9',      // fond très légèrement teinté teal
  card: '#FFFFFF',
  ink: '#1F2937',
  'ink-light': '#64748B',
  success: '#22C55E',
  warning: '#B45309',
  danger: '#EF4444',
},
      /**colors: {
  primary: '#26215C',      // violet 900 — foncé, hover, éléments actifs
  secondary: '#534AB7',    // violet 600 — couleur d'action principale
  accent: '#0F6E56',       // teal 600 — mis en avant, éléments positifs
  surface: '#F8F7FC',      // fond très légèrement teinté violet
  card: '#FFFFFF',
  ink: '#1F2937',
  'ink-light': '#64748B',
  success: '#22C55E',
  warning: '#B45309',
  danger: '#EF4444',
},
      colors: {
  primary: '#4A1B0C',      // coral 900 — foncé, hover, éléments actifs
  secondary: '#D85A30',    // coral 400 — couleur d'action principale
  accent: '#0F6E56',       // teal 600 — mis en avant, éléments positifs
  surface: '#FDF8F6',      // fond très légèrement teinté coral (au lieu de gris froid)
  card: '#FFFFFF',
  ink: '#1F2937',
  'ink-light': '#64748B',
  success: '#22C55E',
  warning: '#B45309',      // amber 600 — un peu plus profond que ton F59E0B d'origine
  danger: '#EF4444',

      },**/
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
}