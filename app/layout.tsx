import React from 'react';
import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google'; // Ajout de Source_Serif_4
import './globals.css';
import { ThemeProvider } from '~/components/layout/ThemeProviderClient';
import { ThemeToggler } from '~/components/layout/ThemeToggler';

// Configuration de la police Inter pour le corps du texte
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter', // Variable CSS pour Inter
});

// Configuration de la police Source Serif 4 pour l'éditeur
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif', // Variable CSS pour Source Serif
  weight: ['400', '600', '700'], // Poids que vous pourriez utiliser
});

export const metadata: Metadata = {
  title: 'BookCraftAI',
  description: "Écrivez des livres avec l'assistance de DeepSeek AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      {/* Application des variables de police au body */}
      <body 
        className={`${inter.variable} ${sourceSerif.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col bg-background">
            {/* Vous pourriez ajouter un Header ici */}
            <div className="flex-1">
              <main>{children}</main>
            </div>
            {/* Vous pourriez ajouter un Footer ici */}
            <div className="fixed bottom-4 right-4 z-50">
              <ThemeToggler />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
