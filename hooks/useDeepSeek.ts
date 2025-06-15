import { useState } from 'react';

// Interface DeepSeekRequest (comme fourni dans le prompt)
// Utilisée pour typer les requêtes envoyées à l'API /api/deepseek/generate
interface DeepSeekRequest {
  type: 'continue' | 'rewrite' | 'suggest' | 'character' | 'plot' | 'analyze';
  context: string; // Le prompt principal ou le texte à traiter
  userPrompt?: string; // Non utilisé directement par /api/deepseek/generate mais fait partie de la définition
  model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner'; // Utilisé par /api/deepseek/generate
  bookContext: {
    genre: string;
    characters: any[]; // Utilisation de 'any' pour correspondre au schéma Zod de l'API
    plotSummary: string;
    style: string;
    previousChapters?: string[]; // Non défini dans le schéma Zod de l'API pour l'instant
  };
  settings: {
    temperature: number;
    maxTokens: number;
    streaming: boolean; // Indique si le client veut une réponse streamée ou complète
  };
}

// Interface pour la réponse attendue de l'API /api/deepseek/generate
// Basée sur AIResponse de DeepSeekService et DeepSeekResponse du prompt
interface GenerateApiResponse {
  content: string;
  suggestions?: string[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number; // Le calcul du coût est fait dans DeepSeekService ou l'API
  };
  quality: {
    coherenceScore: number;
    creativityScore: number;
    relevanceScore: number;
  };
  metadata: {
    generatedAt: string; // Date en string JSON
    requestId: string;
    processingTime: number;
  };
  error?: string; // Pour les erreurs de l'API
}

// Interface pour les chunks de données streamées depuis /api/deepseek/stream
// Basée sur OpenAI.Chat.Completions.ChatCompletionChunk
interface StreamedChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'system' | 'user' | 'assistant' | 'tool';
      content?: string | null;
      // D'autres champs comme tool_calls peuvent exister
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | null;
    logprobs?: any; // Peut être plus spécifique si nécessaire
  }>;
  usage?: { // L'usage peut être envoyé avec le dernier chunk
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
  };
  // D'autres champs système peuvent exister
}


export const useDeepSeek = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  // Les tokens et coûts pourraient être initialisés depuis un contexte utilisateur global plus tard
  const [tokens, setTokens] = useState({ used: 0, limit: 0 }); // Exemple de structure
  const [cost, setCost] = useState(0); // Coût total ou par session

  /**
   * Appelle l'API de génération non-streamée.
   * Attend une réponse JSON complète.
   */
  const generateContent = async (request: DeepSeekRequest): Promise<GenerateApiResponse> => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/deepseek/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data: GenerateApiResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`);
      }
      
      // Mettre à jour les tokens et coûts si nécessaire (ex: à partir de data.usage)
      // setTokens(prev => ({ ...prev, used: prev.used + (data.usage?.totalTokens || 0) }));
      // setCost(prev => prev + (data.usage?.cost || 0));

      return data;
    } catch (error) {
      console.error('useDeepSeek - generateContent error:', error);
      throw error; // Relancer pour que le composant appelant puisse gérer
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Gère la réponse en streaming depuis l'API /api/deepseek/stream.
   * @param request Les données nécessaires pour la requête de streaming (prompt, bookContext).
   * @param onChunk Fonction callback appelée avec chaque chunk de données reçu.
   * @param onError Fonction callback pour gérer les erreurs de streaming.
   * @param onDone Fonction callback appelée lorsque le stream est terminé.
   */
  const handleStreamingResponse = async (
    requestData: Omit<DeepSeekRequest, 'type' | 'model' | 'settings'> & { settings?: Partial<DeepSeekRequest['settings']> }, // Simplifié pour le stream
    onChunk: (chunk: StreamedChunk) => void,
    onError: (error: Error) => void,
    onDone?: () => void
  ) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/deepseek/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // L'API stream attend un corps spécifique, nous adaptons la requête
        body: JSON.stringify({
            prompt: requestData.context, // 'context' de DeepSeekRequest est le prompt principal
            bookContext: {
                genre: requestData.bookContext.genre,
                style: requestData.bookContext.style,
            }
            // D'autres paramètres comme le modèle pourraient être ajoutés si l'API stream les supporte
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API Error: ${response.status}` }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (onDone) onDone();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Traiter les événements SSE complets dans le buffer
        let eolIndex;
        while ((eolIndex = buffer.indexOf('\n\n')) >= 0) {
          const message = buffer.substring(0, eolIndex).trim();
          buffer = buffer.substring(eolIndex + 2);

          if (message.startsWith('data:')) {
            const jsonData = message.substring('data:'.length).trim();
            try {
              const chunkData: StreamedChunk = JSON.parse(jsonData);
              onChunk(chunkData);
            } catch (e) {
              console.error('Failed to parse stream chunk JSON:', jsonData, e);
              // Ignorer les chunks malformés ou gérer l'erreur
            }
          } else if (message.startsWith('event: error')) {
            const jsonData = buffer.substring(buffer.indexOf('data:') + 'data:'.length).trim();
             try {
              const errorData = JSON.parse(jsonData);
              onError(new Error(errorData.message || 'Unknown stream error event'));
            } catch (e) {
               onError(new Error('Unknown stream error event and failed to parse error data.'));
            }
            reader.cancel(); // Arrêter la lecture en cas d'erreur signalée par le serveur
            break;
          }
        }
      }
    } catch (error) {
      console.error('useDeepSeek - handleStreamingResponse error:', error);
      onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    } finally {
      setIsGenerating(false);
    }
  };

  // D'autres méthodes pourraient être ajoutées ici (ex: suggestImprovements, generateCharacter)
  // qui appelleraient des routes API spécifiques.

  return {
    generateContent,
    handleStreamingResponse,
    isGenerating,
    tokens, // Pourrait être mis à jour par les réponses API
    cost,   // Pourrait être mis à jour par les réponses API
    // setTokens, // Exposer si la mise à jour manuelle est nécessaire
    // setCost,   // Exposer si la mise à jour manuelle est nécessaire
  };
};
