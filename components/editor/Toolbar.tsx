'use client';

import React from 'react';
import { type Editor } from '@tiptap/react';
import { Button } from '~/components/ui/button'; // Utilisation de l'alias Shadcn/ui
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
} from 'lucide-react'; // Icônes populaires pour les barres d'outils

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-300 p-2 mb-2 bg-gray-50 rounded-t-md">
      <Button
        variant={editor.isActive('bold') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        title="Gras"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('italic') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        title="Italique"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('strike') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        title="Barré"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 border-l border-gray-300"></div> {/* Séparateur */}

      <Button
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Titre 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Titre 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Titre 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 border-l border-gray-300"></div> {/* Séparateur */}

      <Button
        variant={editor.isActive('bulletList') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Liste à puces"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('orderedList') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Liste numérotée"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <div className="mx-1 h-6 border-l border-gray-300"></div> {/* Séparateur */}

      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Annuler"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Rétablir"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Toolbar;
