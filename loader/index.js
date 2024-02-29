import '/vendors/babel.js';
import '/babel-plugin/commonAsync.js';
import '/babel-plugin/es6ImportHash.js';
import './global-variables.js';
import { loadModule } from './require.js';
import { insertNode } from './dependency-tree.js';

//注册serviceworker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { type: 'module' });
    } catch (error) {
      console.error(`注册serviceworker失败`, error);
    }
  }
};

navigator.serviceWorker.onmessage = async (event) => {
  const { data } = event;
  const registration = await navigator.serviceWorker.ready;
  if (data.type === 'getmodule') {
    try {
      await loadModule(data.module);

      const moduleExports = await _window[data.module];
      registration.active.postMessage({
        type: 'getmodule',
        module: data.module,
        code: 0,
        data: Object.keys(moduleExports)
      });
    } catch (err) {
      registration.active.postMessage({
        type: 'getmodule',
        module: data.module,
        code: 1,
        error: err
      });
    }
  }
  if (data.type === 'isexist') {
    if (_window[data.module]) {
      try {
        const moduleExports = await _window[data.module];
        registration.active.postMessage({
          type: 'isexist',
          module: data.module,
          code: 0,
          data: Object.keys(moduleExports)
        });
      } catch (err) {
        registration.active.postMessage({
          type: 'isexist',
          module: data.module,
          code: 2,
          error: new Error('no exist ' + data.module)
        });
      }
    } else {
      registration.active.postMessage({
        type: 'isexist',
        module: data.module,
        code: 1,
        error: new Error('no exist ' + data.module)
      });
    }
  }
  if (data.type === 'dependency') {
    const { parent, child } = data;
    insertNode(parent, child);
  }
};

let onReadyResolve;
export const onReady = new Promise((resolve, reject) => {
  onReadyResolve = resolve;
});

registerServiceWorker();
navigator.serviceWorker.ready.then((registration) => {
  registration.active.postMessage({ type: 'clearCache' });
  if (navigator.serviceWorker.controller) onReadyResolve();
});
navigator.serviceWorker.oncontrollerchange = (evt) => {
  onReadyResolve();
};
