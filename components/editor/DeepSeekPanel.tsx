'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import ModelSelector, { DEEPSEEK_MODELS, DeepSeekModelValue } from '../deepseek/ModelSelector';
import PromptBuilder from '../deepseek/PromptBuilder';
import { useDeepSeek } from '~/hooks/useDeepSeek'; // Assurez-vous que le chemin est correct

interface DeepSeekPanelProps {
  isVisible: boolean;
  onClose?: () => void;
}

const DeepSeekPanel: React.FC<DeepSeekPanelProps> = ({ isVisible, onClose }) => {
  const [selectedModel, setSelectedModel] = useState<DeepSeekModelValue>(DEEPSEEK_MODELS.CHAT);
  const { generateContent, isGenerating, handleStreamingResponse } = useDeepSeek();
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [errorResponse, setErrorResponse] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, model: DeepSeekModelValue) => {
    console.log(`DeepSeekPanel: Génération demandée avec le modèle ${model} et le prompt: "${prompt}"`);
    setGeneratedResponse(null);
    setErrorResponse(null);

    const shouldUseStreaming = false; // Mettre à true pour tester le streaming ici

    const requestData = {
      type: 'continue' as const,
      context: prompt,
      model: model,
      bookContext: { 
        genre: 'Fiction', 
        style: 'Narratif', 
        characters: [],   
        plotSummary: '',  
      },
      settings: { 
        temperature: 0.7, 
        maxTokens: 500,   
        streaming: shouldUseStreaming,
      },
    };

    try {
      if (shouldUseStreaming) {
        setGeneratedResponse(""); // Initialiser pour le streaming
        await handleStreamingResponse(
          { context: requestData.context, bookContext: requestData.bookContext, settings: { streaming: true, temperature: requestData.settings.temperature, maxTokens: requestData.settings.maxTokens } },
          (chunk) => {
            const contentChunk = chunk.choices[0]?.delta?.content;
            if (contentChunk) {
              setGeneratedResponse(prev => (prev || "") + contentChunk);
            }
          },
          (error) => {
            console.error("DeepSeekPanel stream error:", error);
            setErrorResponse(`Erreur de streaming: ${error.message}`);
          },
          () => {
            console.log("DeepSeekPanel stream done.");
          }
        );
      } else {
        const response = await generateContent(requestData);
        console.log('DeepSeekPanel: Réponse reçue:', response);
        if (response && typeof response.content === 'string') {
          setGeneratedResponse(response.content);
        } else if (response && response.content && typeof response.content !== 'string') {
          console.warn('DeepSeekPanel: response.content is not a string:', response.content);
          setGeneratedResponse(`Contenu reçu (non-string): ${JSON.stringify(response.content, null, 2)}`);
        } else if (response && response.error) {
          setErrorResponse(response.error);
        } else {
          console.warn('DeepSeekPanel: Réponse inattendue ou contenu manquant:', response);
          setErrorResponse('Réponse inattendue ou contenu manquant de la part de l_API.');
        }
      }
    } catch (error) {
      console.error('DeepSeekPanel: Erreur lors de la génération:', error);
      setErrorResponse(error instanceof Error ? error.message : String(error));
    }
  };

  if (!isVisible) {
    return null;
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '300px',
    zIndex: 1000,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
  };

  return (
    <div style={panelStyle}>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Assistant DeepSeek</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isGenerating}
          />
          <PromptBuilder
            selectedModel={selectedModel}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
          {isGenerating && (
            <p className="text-sm text-muted-foreground text-center">Génération en cours...</p>
          )}
          {generatedResponse && !isGenerating && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md max-h-48 overflow-y-auto">
              <h4 className="text-sm font-semibold mb-1">Réponse de DeepSeek:</h4>
              <p className="text-xs whitespace-pre-wrap">{generatedResponse}</p>
            </div>
          )}
          {errorResponse && !isGenerating && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              <h4 className="text-sm font-semibold mb-1">Erreur:</h4>
              <p className="text-xs whitespace-pre-wrap">{errorResponse}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground mb-2 pt-2 border-t">
              Autres fonctionnalités (placeholders) :
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Configuration IA (température, max tokens)</li>
              <li>Historique des réponses</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeepSeekPanel;
