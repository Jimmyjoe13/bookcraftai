'use client';

import React from 'react';
import { useEditor, EditorContent, Editor as TipTapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Toolbar from './Toolbar'; // Importer la barre d'outils
// Vous pourrez ajouter d'autres extensions TipTap ici plus tard (ex: Placeholder, Link, etc.)

interface EditorComponentProps {
  onEditorInstance?: (editor: TipTapEditor) => void; // Callback pour passer l'instance de l'éditeur
  initialContent?: string; // Contenu initial pour l'éditeur
  editable?: boolean; // Si l'éditeur doit être modifiable
}

const EditorComponent: React.FC<EditorComponentProps> = ({ 
  onEditorInstance, 
  initialContent = '<p>Commencez à écrire votre livre ici...</p>',
  editable = true,
}) => {
  const editor = useEditor({
    immediatelyRender: false, // Ajouté pour corriger l'erreur d'hydratation SSR
    extensions: [
      StarterKit.configure({
        // Vous pouvez configurer les extensions du StarterKit ici
        // Par exemple, désactiver certaines marques :
        // heading: { levels: [1, 2, 3] },
        // bold: false,
      }),
      // Ajoutez d'autres extensions ici
    ],
    content: initialContent,
    editable: editable,
    editorProps: { // Ajout de editorProps pour appliquer des classes au conteneur éditable
      attributes: {
        class: 'prose font-serif dark:prose-invert max-w-none focus:outline-none p-2 min-h-[200px]', 
        // Ajout de font-serif, dark:prose-invert pour le mode sombre, et un padding/min-height
      },
    },
    onUpdate: ({ editor }) => {
      // Gérer les mises à jour du contenu si nécessaire
      // console.log('Editor content updated:', editor.getHTML());
    },
    onCreate: ({ editor }) => {
      if (onEditorInstance) {
        onEditorInstance(editor);
      }
    },
  });

  if (!editor) {
    return null; // Ou un indicateur de chargement
  }

  return (
    <div className="tiptap-editor-wrapper border border-input rounded-md bg-background"> {/* Utilisation des couleurs Shadcn/ui */}
      <Toolbar editor={editor} />
      {/* EditorContent rendra l'élément avec les classes de editorProps.attributes */}
      <EditorContent editor={editor} /> 
    </div>
  );
};

export default EditorComponent;
