'use client';

import React, { useState } from 'react';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { DeepSeekModelValue } from './ModelSelector'; // Importer le type du modèle

interface PromptBuilderProps {
  selectedModel: DeepSeekModelValue; // Pour savoir quel modèle est actuellement sélectionné
  onGenerate: (prompt: string, model: DeepSeekModelValue) => void; // Callback pour lancer la génération
  isGenerating?: boolean; // Pour désactiver le bouton pendant la génération
}

const PromptBuilder: React.FC<PromptBuilderProps> = ({
  selectedModel,
  onGenerate,
  isGenerating = false,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim()) {
      onGenerate(prompt.trim(), selectedModel);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="prompt-textarea" className="text-sm font-medium">
        Votre Prompt
      </Label>
      <Textarea
        id="prompt-textarea"
        placeholder={`Écrivez votre instruction pour ${selectedModel}...`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className="resize-none"
        disabled={isGenerating}
      />
      <Button
        onClick={handleSubmit}
        disabled={isGenerating || !prompt.trim()}
        className="w-full"
      >
        {isGenerating ? 'Génération en cours...' : `Générer avec ${selectedModel}`}
      </Button>
    </div>
  );
};

export default PromptBuilder;
