import { useState } from 'react';
import { useDeepSeek } from './useDeepSeek'; // Importer le hook principal
// import { Editor } from '@tiptap/react'; // Importer Editor de TipTap lorsque configuré

// Placeholder pour le type Editor de TipTap
type Editor = any;

// Interface pour les données de la requête de suggestion, basée sur DeepSeekRequest
// mais simplifiée pour ce cas d'usage.
interface SuggestionRequestData {
  type: 'suggest'; // Type spécifique pour cette action
  context: string; // Le texte sélectionné sur lequel baser la suggestion
  model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner'; // Modèle à utiliser
  bookContext: { // Doit correspondre à la structure attendue par DeepSeekRequest['bookContext']
    genre: string;
    style: string;
    characters: any[]; // Ajouté pour la compatibilité
    plotSummary: string; // Ajouté pour la compatibilité
    // D'autres éléments de bookContext pourraient être ajoutés si pertinents pour les suggestions
  };
  settings: { // Paramètres spécifiques pour la requête de suggestion
    temperature: number;
    maxTokens: number;
    streaming: boolean; // Généralement false pour une suggestion simple
  };
}

export const useBookEditor = (bookId: string) => {
  const { generateContent, handleStreamingResponse, isGenerating: isAIServiceBusy } = useDeepSeek();
  const [editor, setEditor] = useState<Editor | null>(null); // État pour l'instance de l'éditeur TipTap

  // État local pour ce hook, par exemple pour le contenu en cours de génération par auto-complétion
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  /**
   * Insère une suggestion générée par l'IA dans l'éditeur.
   * @param selectedText Le texte actuellement sélectionné par l'utilisateur.
   */
  const insertAISuggestion = async (selectedText: string) => {
    if (!editor) {
      console.warn('Editor not available for insertAISuggestion');
      return;
    }

    // Construire la requête pour l'API de génération
    // Utilisation de generateContent qui attend une réponse complète.
    const requestData: SuggestionRequestData = {
      type: 'suggest',
      context: selectedText,
      model: 'deepseek-chat', // Modèle par défaut pour les suggestions créatives
      bookContext: {
        // Ces valeurs devraient provenir des métadonnées du livre (bookId)
        genre: 'Fiction', // Placeholder
        style: 'Narratif', // Placeholder
        characters: [], // Placeholder pour correspondre à DeepSeekRequest
        plotSummary: '', // Placeholder pour correspondre à DeepSeekRequest
      },
      settings: {
        temperature: 0.7,
        maxTokens: 150, // Les suggestions sont généralement plus courtes
        streaming: false, // On attend une réponse complète pour une suggestion
      },
    };

    try {
      const response = await generateContent(requestData); // generateContent s'attend à DeepSeekRequest complet
      
      if (response.content && editor) {
        // Insérer le contenu à la position actuelle du curseur ou de la sélection
        // editor.chain().focus().insertContent(response.content).run();
        // Pour être plus précis sur la position, surtout si rien n'est sélectionné :
        const { state } = editor;
        const { from, to } = state.selection;
        editor.chain().focus().insertContentAt({ from, to }, response.content).run();
        console.log('TipTap Integration: Content inserted via editor.chain()');
      }
    } catch (error) {
      console.error('useBookEditor - insertAISuggestion error:', error);
      // Gérer l'erreur, par exemple afficher une notification à l'utilisateur
    }
  };

  /**
   * Gère l'auto-complétion en temps réel avec DeepSeek.
   * @param currentText Le texte actuel tapé par l'utilisateur avant le curseur.
   * @param onStreamedContent Callback pour recevoir le contenu streamé.
   */
  const autoComplete = async (
    currentText: string,
    onStreamedContent: (contentChunk: string) => void,
    onStreamError: (error: Error) => void,
    onStreamDone?: () => void
  ) => {
    if (isAIServiceBusy || isAutoCompleting) return; // Éviter les appels multiples

    setIsAutoCompleting(true);

    // Données pour la requête de streaming
    const requestDataForStream = {
        context: currentText, // Le texte sur lequel baser l'auto-complétion
        bookContext: {
            // Ces valeurs devraient provenir des métadonnées du livre (bookId)
            genre: 'Fiction', // Placeholder
            style: 'Narratif', // Placeholder
            characters: [], // Placeholder pour correspondre à DeepSeekRequest
            plotSummary: '', // Placeholder pour correspondre à DeepSeekRequest
        },
        // settings n'est pas directement dans requestData pour handleStreamingResponse,
        // mais l'API /stream pourrait être adaptée pour les accepter.
        // Pour l'instant, l'API stream utilise des settings par défaut.
    };
    
    try {
      await handleStreamingResponse(
        requestDataForStream,
        (chunk) => { // onChunk
          const contentChunk = chunk.choices[0]?.delta?.content;
          if (contentChunk) {
            onStreamedContent(contentChunk);
          }
        },
        (error) => { // onError
          console.error('useBookEditor - autoComplete stream error:', error);
          onStreamError(error);
          setIsAutoCompleting(false);
        },
        () => { // onDone
          if (onStreamDone) onStreamDone();
          setIsAutoCompleting(false);
        }
      );
    } catch (error) {
        // Erreur initiale de la requête fetch elle-même
        const err = error instanceof Error ? error : new Error('Unknown error during auto-completion setup');
        console.error('useBookEditor - autoComplete setup error:', err);
        onStreamError(err);
        setIsAutoCompleting(false);
    }
  };

  // Fonction pour initialiser l'éditeur (à appeler lorsque TipTap est prêt)
  const initializeEditor = (editorInstance: Editor) => {
    setEditor(editorInstance);
  };

  return {
    editor, // L'instance de l'éditeur TipTap
    initializeEditor,
    insertAISuggestion,
    autoComplete,
    isAISuggesting: isAIServiceBusy && !isAutoCompleting, // Si le service IA est occupé pour une suggestion
    isAutoCompleting: isAutoCompleting, // Si l'auto-complétion est active
  };
};
