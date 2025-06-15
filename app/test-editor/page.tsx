'use client'; // Nécessaire pour les hooks React et la gestion d'état côté client

import React, { useState } from 'react';
import EditorComponent from '../../components/editor/Editor'; // Importer le vrai composant
import DeepSeekPanel from '../../components/editor/DeepSeekPanel'; // Importer le panneau DeepSeek
import { useBookEditor } from '../../hooks/useBookEditor';
import { Button as ShadButton } from '~/components/ui/button'; // Importer le bouton Shadcn pour le panneau

export default function TestEditorPage() {
  const bookIdForTest = 'test-book-123'; // ID de livre factice pour le test
  const { 
    initializeEditor, 
    insertAISuggestion, 
    autoComplete, 
    isAISuggesting, 
    isAutoCompleting 
  } = useBookEditor(bookIdForTest);

  const [selectedText, setSelectedText] = useState('un début prometteur');
  const [autoCompleteInput, setAutoCompleteInput] = useState('Il était une fois');
  const [streamedContent, setStreamedContent] = useState('');
  const [isDeepSeekPanelVisible, setIsDeepSeekPanelVisible] = useState(true); // État pour la visibilité du panneau

  const handleEditorReady = (editorInstance: any) => {
    initializeEditor(editorInstance);
    console.log('TestEditorPage: Editor instance received by useBookEditor.');
  };

  const handleSuggest = async () => {
    console.log(`TestEditorPage: Demande de suggestion pour "${selectedText}"`);
    setStreamedContent('');
    try {
      await insertAISuggestion(selectedText);
    } catch (error) {
      console.error("TestEditorPage: Erreur lors de la demande de suggestion:", error);
      alert(`Erreur de suggestion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleAutoComplete = async () => {
    console.log(`TestEditorPage: Demande d'auto-complétion pour "${autoCompleteInput}"`);
    setStreamedContent('');
    await autoComplete(
      autoCompleteInput,
      (contentChunk) => {
        setStreamedContent(prev => prev + contentChunk);
      },
      (error) => {
        console.error("TestEditorPage: Erreur d'auto-complétion (stream):", error);
        setStreamedContent(prev => prev + `\n[ERREUR STREAM: ${error.message}]`);
      },
      () => {
        console.log("TestEditorPage: Auto-complétion (stream) terminée.");
        setStreamedContent(prev => prev + "\n[FIN DU STREAM]");
      }
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Page de Test de l'Éditeur DeepSeek</h1>
      
      <ShadButton onClick={() => setIsDeepSeekPanelVisible(prev => !prev)} variant="outline" className="mb-4">
        {isDeepSeekPanelVisible ? 'Cacher' : 'Afficher'} le Panneau DeepSeek
      </ShadButton>

      <DeepSeekPanel 
        isVisible={isDeepSeekPanelVisible} 
        onClose={() => setIsDeepSeekPanelVisible(false)} 
      />
      
      <h2>Éditeur TipTap</h2>
      <EditorComponent onEditorInstance={handleEditorReady} />

      <div style={{ marginTop: '20px', marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
        <h3>Test de Suggestion</h3>
        <p>Texte sélectionné (simulé): "{selectedText}"</p>
        <button 
          onClick={handleSuggest} 
          disabled={isAISuggesting || isAutoCompleting}
          style={{ padding: '8px 12px', marginRight: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isAISuggesting ? 'Suggestion en cours...' : 'Obtenir une Suggestion'}
        </button>
        {isAISuggesting && <p>Chargement de la suggestion...</p>}
      </div>

      <div style={{ marginTop: '20px', marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
        <h3>Test d'Auto-complétion (Streaming)</h3>
        <p>Texte d'entrée (simulé): "{autoCompleteInput}"</p>
        <button 
          onClick={handleAutoComplete} 
          disabled={isAutoCompleting || isAISuggesting}
          style={{ padding: '8px 12px', marginRight: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isAutoCompleting ? 'Auto-complétion en cours...' : "Lancer l'Auto-complétion"}
        </button>
        {isAutoCompleting && <p>Réception du stream...</p>}
        {streamedContent && (
          <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #eee', background: '#f0f0f0' }}>
            <h4>Contenu Streamé:</h4>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{streamedContent}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
