import React, { useEffect, useRef } from 'react';
import type * as monaco from 'monaco-editor';
import { useProjectContext } from './context';
import { getFileFullPath } from '@/utils/path';
import { FileItem } from '@online-editor/parser/common/types';

export default function Content() {
  const { curFile, setCurFile, exFsData } = useProjectContext();
  const dirRef = React.useRef(exFsData);
  dirRef.current = exFsData;
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);
  useEffect(() => {
    import('monaco-editor').then((monaco) => {
      // window.__debug_monaco = monaco;
      window.MonacoEnvironment.getWorkerUrl = (_moduleId: string, label: string) => {
        if (label === 'json') return '/_next/static/json.worker.js';
        if (label === 'css') return '/_next/static/css.worker.js';
        if (label === 'html') return '/_next/static/html.worker.js';
        if (label === 'typescript' || label === 'javascript') return '/_next/static/ts.worker.js';
        return '/_next/static/editor.worker.js';
      };
      editorRef.current = monaco.editor.create(containerRef.current, {
        model: null,
        fixedOverflowWidgets: true
      });
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React
      });
      // monaco.editor.registerEditorOpener({
      //   openCodeEditor: async (source, resource, selectionOrPosition) => {
      //     const models = monaco.editor.getModels();
      //     const parts = resource.path.split('/');
      //     parts.shift();

      //     let dirs: FileItem[] = dirRef.current.source;
      //     let cur: FileItem;
      //     while (parts.length > 0) {
      //       const file = dirs.find(
      //         (item) =>
      //           item.name == parts[0] &&
      //           ((parts.length > 1 && item.type === 'dir') ||
      //             (parts.length === 1 && item.type === 'file'))
      //       );
      //       if (file.type === 'file') {
      //         cur = file;
      //       } else dirs = file.children;
      //       parts.shift();
      //     }
      //     setCurFile(cur);

      //     const model = models.find((item) => item.uri.path === resource.path);
      //     if (model) {
      //       editorRef.current.setModel(model);
      //       editorRef.current.setSelection(selectionOrPosition as monaco.IRange);
      //       editorRef.current.revealLine((selectionOrPosition as monaco.IRange).startLineNumber);
      //       return true;
      //     }
      //     return false;
      //   }
      // });
    });
  }, [setCurFile]);
  useEffect(() => {
    import('monaco-editor').then((monaco) => {
      if (curFile) {
        const uri = new monaco.Uri().with({ path: getFileFullPath(curFile) });
        let model = monaco.editor.getModel(uri);
        if (!model) {
          model = monaco.editor.createModel(curFile.content, null, uri);
        }
        editorRef.current.setModel(model);
      }
    });
  }, [curFile]);

  useEffect(() => {
    if (exFsData) {
      import('monaco-editor').then((monaco) => {
        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

        const queue: FileItem[] = [...exFsData.source, exFsData.nodeModules];
        while (queue.length > 0) {
          const file = queue.shift();
          if (file.type === 'file') {
            const uri = new monaco.Uri().with({ path: getFileFullPath(file) });
            let model = monaco.editor.getModel(uri);
            if (!model) {
              model = monaco.editor.createModel(file.content, null, uri);
              if (uri.path.includes('lodash.js')) {
                debugger;
                monaco.languages.typescript.javascriptDefaults.addExtraLib(
                  'export default {}',
                  '/node_modules/@types/lodash/index.d.ts'
                );
                // const uri = new monaco.Uri().with({
                //   path: '/node_modules/@types/lodash/index.d.ts'
                // });
                // monaco.editor.createModel('export default {}', null, uri);
              }
            }
          } else {
            queue.unshift(...file.children);
          }
        }
      });
    }
  }, [exFsData]);
  return <div className='h-full overflow-auto' ref={containerRef}></div>;
}
