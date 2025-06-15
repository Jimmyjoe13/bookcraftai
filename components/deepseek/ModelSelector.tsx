'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'; // Utilisation de l'alias Shadcn/ui
import { Label } from '~/components/ui/label';

// Les modèles DeepSeek tels que définis dans votre prompt initial
const DEEPSEEK_MODELS = {
  CHAT: 'deepseek-chat',
  CODER: 'deepseek-coder',
  REASONER: 'deepseek-reasoner',
} as const;

type DeepSeekModelValue = typeof DEEPSEEK_MODELS[keyof typeof DEEPSEEK_MODELS];

interface ModelSelectorProps {
  selectedModel: DeepSeekModelValue;
  onModelChange: (model: DeepSeekModelValue) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="model-selector" className="text-sm font-medium">
        Modèle DeepSeek
      </Label>
      <Select
        value={selectedModel}
        onValueChange={(value: string) => onModelChange(value as DeepSeekModelValue)}
        disabled={disabled}
        name="model-selector" // Ajouté pour l'accessibilité, bien que Label htmlFor pointe sur l'id
        // id="model-selector" // L'id est généralement géré par le composant Select lui-même ou son trigger
      >
        <SelectTrigger id="model-selector-trigger" className="w-full"> {/* Ajout d'un id au trigger pour le label */}
          <SelectValue placeholder="Sélectionner un modèle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEEPSEEK_MODELS.CHAT}>
            DeepSeek Chat (Créatif)
          </SelectItem>
          <SelectItem value={DEEPSEEK_MODELS.CODER}>
            DeepSeek Coder (Technique)
          </SelectItem>
          <SelectItem value={DEEPSEEK_MODELS.REASONER}>
            DeepSeek Reasoner (Analyse)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
export { DEEPSEEK_MODELS }; // Exporter pour une utilisation ailleurs si nécessaire
export type { DeepSeekModelValue }; // Exporter le type pour une utilisation ailleurs
