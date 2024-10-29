import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor';
import metadata from 'monaco-editor/esm/metadata';
import './index.css';

console.log('metadata.languages:', metadata);

// self.MonacoEnvironment = {
//     getWorkerUrl: function (moduleId, label) {
//         if (label === 'json') {
//             return './json.worker.bundle.js';
//         }
//         if (label === 'css' || label === 'scss' || label === 'less') {
//             return './css.worker.bundle.js';
//         }
//         if (label === 'html' || label === 'handlebars' || label === 'razor') {
//             return './html.worker.bundle.js';
//         }
//         if (label === 'typescript' || label === 'javascript') {
//             return './ts.worker.bundle.js';
//         }
//         return './editor.worker.bundle.js';
//     }
// };

async function getAssetContent(path) {
  return fetch(path).then((res) => res.text());
}
async function getAssets() {
  return {
    '/foo.ts': await getAssetContent('/$$PUBLIC/foo.ts'),
    '/index.ts': await getAssetContent('/$$PUBLIC/index.ts')
  };
}
// monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
//   target: monaco.languages.typescript.ScriptTarget.ES2015,
//   allowNonTsExtensions: true,
// });
// monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
//   noSemanticValidation: true,
//   noSyntaxValidation: false,
// });

monaco.editor.defineTheme('appforge-theme', {
  base: 'vs',
  inherit: true,
  colors: {
    'editorGutter.background': '#007DFA',
    'editorLineNumber.foreground': '#fff',
    'editorWidget.border': '#ff0000',
    'editorHoverWidget.border': '#ff0000',
    'input.border': '#ff0000',
    'scrollbar.shadow': '#ff000000'
  },
  rules: []
});

export function App() {
  const containerRef = React.useRef();
  const editorRef = React.useRef();
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    (async () => {
      console.log(monaco.Uri.parse('ts:filename/facts.d.ts'));
      //添加额外的定义文件
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        `
         export function sayTest(arg:number):number;
        `,
        'file:///node_modules/@types/facts/index.d.ts'
      );

      editorRef.current = monaco.editor.create(
        containerRef.current,
        { model: null, theme: 'appforge-theme' },
        {
          openCodeEditor: async ({ resource, options }, editor) => {
            debugger;
            // Open the file with this path
            // This should set the model with the path and value
            this.props.onOpenPath(resource.path);

            // Move cursor to the desired position
            editor.setSelection(options.selection);

            // Scroll the editor to bring the desired line into focus
            editor.revealLine(options.selection.startLineNumber);

            return Promise.resolve({
              getControl: () => editor
            });
          }
        }
      );
      monaco.editor.registerEditorOpener({
        openCodeEditor: async (source, resource, selectionOrPosition) => {
          const models = monaco.editor.getModels();
          const model = models.find((item) => item.uri.path === resource.path);
          if (model) {
            editorRef.current.setModel(model);
            editorRef.current.setSelection(selectionOrPosition);
            editorRef.current.revealLine(selectionOrPosition.startLineNumber);
            return true;
          }
          return false;
        }
      });
      const assets = await getAssets();
      setAssets(assets);
      Object.entries(assets).forEach((item) => {
        const uri = new monaco.Uri().with({ path: item[0] });

        const model = monaco.editor.createModel(item[1], 'javascript', uri);
        if (item[0] === '/index.ts') {
          editorRef.current.setModel(model);
        }
      });

      console.log(monaco.editor.getModels());
      setTimeout(() => {
        const height = editorRef.current.getContentHeight();
        editorRef.current.layout({ height, width: 500 });
      }, 0);

      console.log(monaco.languages.typescript.javascriptDefaults.getExtraLibs());
    })();
  }, []);

  const open = (path) => {
    const models = monaco.editor.getModels();
    const model = models.find((item) => item.uri.path === path);
    editorRef.current.setModel(model);
  };

  return (
    <div className='flex '>
      <div className='flex-none w-[200px]'>
        {Object.entries(assets).map((asset) => {
          return (
            <div
              key={asset[0]}
              className='p-[10px] text-[blue]'
              onClick={() => {
                open(asset[0]);
              }}
            >
              {asset[0]}
            </div>
          );
        })}
      </div>
      <div className='flex-auto ' ref={containerRef}></div>
    </div>
  );
}

const rootDom = document.getElementById('app');
const root = createRoot(rootDom);
root.render(<App />);
