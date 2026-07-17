import { useCallback, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  language?: string;
  extensions?: any[];
  className?: string;
  onViewUpdate?: (view: EditorView) => void;
}

const darkTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent', color: '#e5e5e5' },
    '.cm-content': { caretColor: '#60a5fa' },
    '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: '#525252' },
    '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(96,165,250,0.25)'
    }
  },
  { dark: true }
);

/** Brighter syntax colors for tokens hard to see on dark bg */
const brightSyntax = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.url, color: '#22d3ee' },
  ])
);

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
  language,
  extensions,
  className,
  onViewUpdate
}: CodeEditorProps) {
  const editorViewRef = useRef<EditorView | null>(null);
  const handleUpdate = useCallback(
    (update: ViewUpdate) => {
      if (onViewUpdate && !editorViewRef.current) {
        editorViewRef.current = update.view;
        onViewUpdate(update.view);
      }
    },
    [onViewUpdate]
  );

  const exts = useMemo(() => {
    const base = [EditorView.lineWrapping, brightSyntax];
    if (extensions) base.push(...extensions);
    return base;
  }, [extensions]);
  const editorClassName = [
    className,
    'h-full',
    !readOnly && onChange ? 'toolsmith-input-editor' : undefined
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      theme={darkTheme}
      extensions={exts}
      height="100%"
      className={editorClassName}
      onUpdate={handleUpdate}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        foldGutter: false,
        autocompletion: false,
        searchKeymap: false
      }}
    />
  );
}
