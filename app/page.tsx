import React from 'react';

export default function HomePage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Bienvenue sur BookCraftAI</h1>
      <p>Ceci est la page d'accueil.</p>
      <p>
        <a href="/test-editor" style={{ color: 'blue', textDecoration: 'underline' }}>
          Aller à la page de test de l'éditeur
        </a>
      </p>
    </div>
  );
}
