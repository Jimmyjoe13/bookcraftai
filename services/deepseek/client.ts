import OpenAI from 'openai';

// Clé API et URL de base DeepSeek (comme fourni dans le prompt)
const DEEPSEEK_API_KEY = 'sk-50b652a84e4c486a935c3f46fdf5e640';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

// Modèles disponibles (comme fourni dans le prompt)
const DEEPSEEK_MODELS = {
  CHAT: 'deepseek-chat',
  CODER: 'deepseek-coder',
  REASONER: 'deepseek-reasoner'
} as const;

// Interface pour le contexte du livre, utilisée par generateContent
interface BookContext {
  genre: string;
  style: string;
  // D'autres champs pourraient être ajoutés ici selon DeepSeekRequest.bookContext
  // characters?: Character[];
  // plotSummary?: string;
  // previousChapters?: string[];
}

// Interface pour un personnage (basée sur les informations du prompt)
interface Character {
  id: string;
  name: string;
  description: string;
  // ... autres détails du personnage
}

// Interface pour la réponse de DeepSeek (comme fourni dans le prompt)
interface DeepSeekResponse {
  content: string;
  suggestions?: string[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  quality: {
    coherenceScore: number;
    creativityScore: number;
    relevanceScore: number;
  };
  metadata: {
    generatedAt: Date;
    requestId: string;
    processingTime: number;
  };
}

// AIResponse peut être un alias de DeepSeekResponse ou une extension
interface AIResponse extends DeepSeekResponse {}

export class DeepSeekService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: DEEPSEEK_BASE_URL,
    });
  }

  /**
   * Génère du contenu en utilisant le modèle deepseek-chat.
   * Note: processStreamResponse est un placeholder et doit être implémenté
   * pour gérer correctement le flux de données si stream: true est utilisé
   * pour un traitement en temps réel côté client via une autre route.
   * Si cette méthode doit retourner une réponse agrégée, processStreamResponse
   * devra collecter tous les chunks du stream.
   */
  async generateContent(prompt: string, context: BookContext): Promise<AIResponse> {
    const stream = await this.client.chat.completions.create({
      model: DEEPSEEK_MODELS.CHAT,
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant d'écriture expert. Genre: ${context.genre}. Style: ${context.style}.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: true // Important pour l'UX temps réel, mais nécessite une gestion adaptée
    });

    // processStreamResponse devra agréger les chunks du stream en une AIResponse complète.
    // Pour une véritable gestion de flux vers le client, une méthode dédiée
    // (ex: generateStreamingContent) retournant un ReadableStream serait plus appropriée.
    return this.processStreamResponse(stream);
  }

  /**
   * Placeholder pour traiter la réponse en streaming.
   * Devrait agréger les chunks pour former une AIResponse complète.
   * Ou, si le service est utilisé par une API de streaming, cette logique serait différente.
   */
  private async processStreamResponse(stream: any /* OpenAI.AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> */): Promise<AIResponse> {
    let content = '';
    let finalChunkData: any = null;

    for await (const chunk of stream) {
      content += chunk.choices[0]?.delta?.content || '';
      // Supposons que le dernier chunk ou un chunk spécifique contienne les métadonnées d'usage, etc.
      // Ceci est une simplification. La structure réelle des chunks doit être inspectée.
      if (chunk.usage) { // Exemple: si l'usage est envoyé à la fin
        finalChunkData = chunk;
      }
    }
    
    // Ceci est une reconstruction très basique.
    // Il faudrait s'assurer que tous les champs de AIResponse sont correctement remplis.
    // La gestion des tokens, coûts, etc., à partir des chunks est complexe.
    // Souvent, l'API fournit ces informations dans le dernier message du stream
    // ou via des événements séparés.
    // Pour l'instant, nous retournons une structure partielle.
    return {
      content: content,
      model: DEEPSEEK_MODELS.CHAT, // Modèle utilisé
      usage: { // Ces valeurs devraient être extraites du stream
        promptTokens: finalChunkData?.usage?.prompt_tokens || 0,
        completionTokens: finalChunkData?.usage?.completion_tokens || 0,
        totalTokens: finalChunkData?.usage?.total_tokens || 0,
        cost: 0, // Le calcul du coût nécessitera les tokens et les prix
      },
      quality: { // Valeurs placeholder
        coherenceScore: 0,
        creativityScore: 0,
        relevanceScore: 0,
      },
      metadata: { // Valeurs placeholder
        generatedAt: new Date(),
        requestId: '', // Devrait être extrait si disponible
        processingTime: 0, // Devrait être calculé
      }
    };
  }

  async suggestImprovements(text: string): Promise<string[]> {
    // TODO: Implémenter la logique avec deepseek-reasoner
    console.log('Suggesting improvements for:', text);
    // Exemple de retour (placeholder)
    return [`Suggestion pour "${text}" basée sur deepseek-reasoner.`];
  }

  async generateCharacter(description: string): Promise<Character> {
    // TODO: Implémenter la logique avec deepseek-chat
    console.log('Generating character for:', description);
    // Exemple de retour (placeholder)
    return {
      id: 'char-' + Date.now(),
      name: 'Personnage Généré',
      description: `Un personnage basé sur: "${description}"`
    };
  }

  /**
   * Méthode dédiée pour la génération de contenu en streaming.
   * Cette méthode serait utilisée par la route API /api/deepseek/stream.
   */
  async generateStreamingContent(prompt: string, context: BookContext): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const stream = await this.client.chat.completions.create({
      model: DEEPSEEK_MODELS.CHAT,
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant d'écriture expert. Genre: ${context.genre}. Style: ${context.style}.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: true
    });
    return stream;
  }
}
