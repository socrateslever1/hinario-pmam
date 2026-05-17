import React, { useCallback, useMemo } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement } from 'slate';
import { withHistory } from 'slate-history';
import { Bold, Italic, List, ListOrdered, Heading2, Quote, Code, Undo2, Redo2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlateEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

type CustomElement = { type: 'paragraph' | 'heading' | 'block-quote' | 'code-block' | 'bulleted-list' | 'numbered-list' | 'list-item'; children: (CustomText | CustomElement)[] };
type CustomText = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

declare module 'slate' {
  interface CustomTypes {
    Editor: import('slate').BaseEditor & import('slate-react').ReactEditor & import('slate-history').HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

export default function SlateEditor({ value, onChange, placeholder = 'Escreva o conteúdo da notícia...' }: SlateEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  // Converter HTML string para Slate format
  const initialValue: Descendant[] = useMemo(() => {
    if (!value) {
      return [{ type: 'paragraph', children: [{ text: '' }] }];
    }
    try {
      // Parse HTML simples para Slate
      const div = document.createElement('div');
      div.innerHTML = value;
      return Array.from(div.childNodes).map((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return { type: 'paragraph', children: [{ text: node.textContent || '' }] };
        }
        const el = node as HTMLElement;
        const text = el.textContent || '';
        switch (el.tagName.toLowerCase()) {
          case 'h2':
            return { type: 'heading', children: [{ text }] };
          case 'blockquote':
            return { type: 'block-quote', children: [{ text }] };
          case 'code':
            return { type: 'code-block', children: [{ text, code: true }] };
          case 'ul':
            return { type: 'bulleted-list', children: [{ type: 'list-item', children: [{ text }] }] };
          case 'ol':
            return { type: 'numbered-list', children: [{ type: 'list-item', children: [{ text }] }] };
          default:
            return { type: 'paragraph', children: [{ text }] };
        }
      });
    } catch {
      return [{ type: 'paragraph', children: [{ text: value }] }];
    }
  }, [value]);

  const handleChange = (newValue: Descendant[]) => {
    const html = newValue
      .map((node) => {
        if (SlateElement.isElement(node)) {
          const text = node.children.map((child) => (child as CustomText).text).join('');
          switch (node.type) {
            case 'heading':
              return `<h2>${text}</h2>`;
            case 'block-quote':
              return `<blockquote>${text}</blockquote>`;
            case 'code-block':
              return `<code>${text}</code>`;
            case 'bulleted-list':
              return `<ul><li>${text}</li></ul>`;
            case 'numbered-list':
              return `<ol><li>${text}</li></ol>`;
            default:
              return `<p>${text}</p>`;
          }
        }
        return '';
      })
      .join('');
    onChange(html);
  };

  const toggleMark = (editor: any, format: string) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const toggleBlock = (editor: any, format: string) => {
    const isActive = isBlockActive(editor, format);
    const isList = ['bulleted-list', 'numbered-list'].includes(format);

    Transforms.unwrapNodes(editor, {
      match: (n) => ['bulleted-list', 'numbered-list'].includes((n as any).type),
      split: true,
    });

    let newProperties: any = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
      const block = { type: format as CustomElement['type'], children: [] as (CustomText | CustomElement)[] };
      Transforms.wrapNodes(editor, block);
    }
  };

  const isMarkActive = (editor: any, format: string) => {
    const marks = Editor.marks(editor);
    return marks ? (marks as Record<string, boolean>)[format] === true : false;
  };

  const isBlockActive = (editor: any, format: string) => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: (n) => (n as any).type === format,
      })
    );
    return !!match;
  };

  return (
    <div className="w-full border border-border rounded-lg overflow-hidden bg-background">
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-3 bg-muted border-b border-border">
          <ToolbarButton
            icon={Bold}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleMark(editor, 'bold');
            }}
            active={isMarkActive(editor, 'bold')}
            title="Negrito (Ctrl+B)"
          />
          <ToolbarButton
            icon={Italic}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleMark(editor, 'italic');
            }}
            active={isMarkActive(editor, 'italic')}
            title="Itálico (Ctrl+I)"
          />
          <ToolbarButton
            icon={Code}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleMark(editor, 'code');
            }}
            active={isMarkActive(editor, 'code')}
            title="Código"
          />
          <div className="w-px bg-border mx-1" />
          <ToolbarButton
            icon={Heading2}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBlock(editor, 'heading');
            }}
            active={isBlockActive(editor, 'heading')}
            title="Título (H2)"
          />
          <ToolbarButton
            icon={Quote}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBlock(editor, 'block-quote');
            }}
            active={isBlockActive(editor, 'block-quote')}
            title="Citação"
          />
          <ToolbarButton
            icon={List}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBlock(editor, 'bulleted-list');
            }}
            active={isBlockActive(editor, 'bulleted-list')}
            title="Lista com marcadores"
          />
          <ToolbarButton
            icon={ListOrdered}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBlock(editor, 'numbered-list');
            }}
            active={isBlockActive(editor, 'numbered-list')}
            title="Lista numerada"
          />
          <div className="w-px bg-border mx-1" />
          <ToolbarButton
            icon={Undo2}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.undo();
            }}
            title="Desfazer"
          />
          <ToolbarButton
            icon={Redo2}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.redo();
            }}
            title="Refazer"
          />
        </div>

        {/* Editor */}
        <Editable
          className="p-4 min-h-[300px] focus:outline-none prose prose-sm max-w-none"
          placeholder={placeholder}
          spellCheck="true"
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        />
      </Slate>
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onMouseDown: (e: React.MouseEvent) => void;
  active?: boolean;
  title?: string;
}

function ToolbarButton({ icon: Icon, onMouseDown, active = false, title }: ToolbarButtonProps) {
  return (
    <button
      onMouseDown={onMouseDown}
      className={cn(
        'p-2 rounded hover:bg-accent transition-colors',
        active && 'bg-accent text-accent-foreground'
      )}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
