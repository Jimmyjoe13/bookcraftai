import { DeepSeekService } from '../../../../services/deepseek/client'; // Ajustement du chemin d'importation

// Interface simple pour le corps de la requête de streaming
// Pourrait être étendue ou validée avec Zod comme pour la route /generate
interface StreamRequestData {
  prompt: string;
  bookContext: {
    genre: string;
    style: string;
    // D'autres champs du BookContext pourraient être ajoutés ici si nécessaire
  };
  // D'autres paramètres comme le modèle, la température, etc., pourraient être ajoutés
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  try {
    const body: StreamRequestData = await req.json();
    const { prompt, bookContext } = body;

    if (!prompt || !bookContext || !bookContext.genre || !bookContext.style) {
      return new Response(JSON.stringify({ error: 'Invalid request body: prompt, bookContext.genre, and bookContext.style are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const deepseek = new DeepSeekService();
          // Appel à la méthode de streaming du service
          const streamResponse = await deepseek.generateStreamingContent(prompt, {
            genre: bookContext.genre,
            style: bookContext.style,
          });

          for await (const chunk of streamResponse) {
            // Chaque chunk de l'SDK OpenAI/DeepSeek est un objet.
            // Nous le stringifions et l'envoyons comme un événement SSE.
            // Le client devra parser ce JSON.
            const data = encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
            controller.enqueue(data);
          }

          // Une fois le stream terminé, nous envoyons un événement spécial pour le signaler au client si nécessaire,
          // ou simplement fermons le contrôleur.
          // Par exemple: controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error during DeepSeek stream generation:', error);
          // Envoyer un message d'erreur via le stream si possible, ou simplement fermer avec une erreur.
          // Le client devrait aussi avoir une gestion d'erreur pour la connexion SSE.
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during stream generation';
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`));
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    // Erreur lors de la lecture ou du parsing du JSON du corps de la requête
    console.error('Error processing stream request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Invalid request format';
    return new Response(JSON.stringify({ error: 'Failed to process request', details: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
