import { useEffect, useRef } from 'react';
import type * as monaco from 'monaco-editor';
import { useProjectContext } from './context';

export default function Content() {
  const { curFile } = useProjectContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);
  useEffect(() => {
    import('monaco-editor').then((monaco) => {
      window.MonacoEnvironment.getWorkerUrl = (_moduleId: string, label: string) => {
        if (label === 'json') return '/_next/static/json.worker.js';
        if (label === 'css') return '/_next/static/css.worker.js';
        if (label === 'html') return '/_next/static/html.worker.js';
        if (label === 'typescript' || label === 'javascript') return '/_next/static/ts.worker.js';
        return '/_next/static/editor.worker.js';
      };
      editorRef.current = monaco.editor.create(containerRef.current, { model: null });
    });
  }, []);
  useEffect(() => {
    import('monaco-editor').then((monaco) => {
      if (curFile) {
        const uri = new monaco.Uri().with({ path: curFile.path });
        let model = monaco.editor.getModel(uri);
        if (!model) {
          model = monaco.editor.createModel(curFile.content, null, uri);
        }
        editorRef.current.setModel(model);
      }
    });
  }, [curFile]);
  return <div className='h-full overflow-auto' ref={containerRef}></div>;
}
