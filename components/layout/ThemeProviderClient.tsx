'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
// import { type ThemeProviderProps } from 'next-themes/dist/types'; // Retrait de cette ligne

// Utilisation d'un type plus générique pour les props si l'importation spécifique pose problème
interface CustomThemeProviderProps {
  children: React.ReactNode;
  [key: string]: any; // Permet d'autres props comme attribute, defaultTheme, etc.
}

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
