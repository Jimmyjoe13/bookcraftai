import { z } from 'zod';
import { DeepSeekService } from '../../../../services/deepseek/client'; // Ajustement du chemin d'importation

// Placeholder pour la gestion utilisateur - à remplacer par votre implémentation réelle
interface User {
  id: string;
  email: string;
  name: string;
  subscription: 'free' | 'writer' | 'pro' | 'enterprise';
  deepseekTokensUsed: number;
  deepseekTokensLimit: number;
  deepseekCostThisMonth: number; // Ajouté pour correspondre à l'interface User du prompt
  aiPreferences: { // Ajouté pour correspondre à l'interface User du prompt
    temperature: number;
    maxTokens: number;
    preferredModel: string;
  };
  createdAt: Date; // Ajouté pour correspondre à l'interface User du prompt
}

async function getCurrentUser(): Promise<User> {
  // Ceci est un placeholder. Implémentez la logique pour récupérer l'utilisateur authentifié.
  // Par exemple, en utilisant NextAuth.js et Supabase.
  console.log('Placeholder: getCurrentUser called');
  return {
    id: 'user-placeholder-id',
    email: 'user@example.com',
    name: 'Placeholder User',
    subscription: 'pro', // Exemple
    deepseekTokensUsed: 1000,
    deepseekTokensLimit: 500000,
    deepseekCostThisMonth: 0,
    aiPreferences: { temperature: 0.7, maxTokens: 2000, preferredModel: 'deepseek-chat' },
    createdAt: new Date(),
  };
}

async function updateUserTokenUsage(userId: string, tokensUsed: number): Promise<void> {
  // Ceci est un placeholder. Implémentez la logique pour mettre à jour l'utilisation des tokens.
  // Par exemple, en mettant à jour l'enregistrement utilisateur dans Prisma.
  console.log(`Placeholder: updateUserTokenUsage called for user ${userId} with ${tokensUsed} tokens.`);
  // Simuler une mise à jour (ne fait rien de persistant ici)
  return Promise.resolve();
}
// Fin des placeholders

// Schéma de validation Zod pour les requêtes de génération
const generateSchema = z.object({
  type: z.enum(['continue', 'rewrite', 'suggest', 'character', 'plot', 'analyze']),
  context: z.string().min(1).max(10000), // Le prompt utilisateur
  // model est utilisé dans DeepSeekRequest, mais DeepSeekService.generateContent utilise un modèle fixe pour l'instant
  // Si le modèle doit être dynamique via la requête, DeepSeekService.generateContent devra être adapté.
  // Pour l'instant, nous le gardons ici car il fait partie du schéma du prompt.
  model: z.enum(['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']),
  bookContext: z.object({ // Contexte du livre
    genre: z.string(),
    // characters et plotSummary sont dans DeepSeekRequest.bookContext, mais BookContext de DeepSeekService est plus simple.
    // Nous allons les inclure ici pour correspondre au schéma du prompt, mais ils ne sont pas tous utilisés par DeepSeekService.generateContent actuel.
    characters: z.array(z.any()).optional(), // Rendre optionnel pour correspondre à BookContext actuel
    plotSummary: z.string().optional(), // Rendre optionnel
    style: z.string(),
    // previousChapters: z.array(z.string()).optional() // Non défini dans BookContext actuel
  }),
  settings: z.object({
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1).max(4000), // Le prompt original avait 4000, DeepSeekService 2000. Cohérence à vérifier.
    streaming: z.boolean(), // Ce booléen indique si le client s'attend à un stream ou une réponse complète.
                           // Cette route /generate est pour une réponse complète.
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = generateSchema.parse(body);

    // Vérifier les limites utilisateur
    const user = await getCurrentUser(); // Utilise le placeholder
    if (user.deepseekTokensUsed >= user.deepseekTokensLimit) {
      return Response.json({ error: 'Token limit exceeded' }, { status: 429 });
    }

    // Si le client demande un stream via cette route, ce n'est pas l'idéal.
    // Cette route est conçue pour retourner une réponse complète.
    // La route /api/deepseek/stream sera pour le streaming.
    if (validatedData.settings.streaming) {
        // On pourrait rediriger ou retourner une erreur, ou appeler la logique de streaming ici
        // mais pour l'instant, on suppose que generateContent gère l'agrégation du stream.
        console.warn("Streaming request received on non-streaming endpoint, but DeepSeekService.generateContent will aggregate.");
    }

    const deepseek = new DeepSeekService();
    // DeepSeekService.generateContent prend (prompt, context)
    // validatedData.context est le prompt utilisateur.
    // validatedData.bookContext contient genre et style.
    const response = await deepseek.generateContent(
      validatedData.context, // Le prompt principal
      { // Le BookContext pour le service
        genre: validatedData.bookContext.genre,
        style: validatedData.bookContext.style,
      }
    );

    // Mettre à jour les statistiques utilisateur
    // response.usage.totalTokens vient de AIResponse, qui est DeepSeekResponse
    await updateUserTokenUsage(user.id, response.usage.totalTokens); // Utilise le placeholder

    return Response.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    console.error('DeepSeek API Error in /generate route:', error);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
