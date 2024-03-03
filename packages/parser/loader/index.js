import '../vendors/babel.js';
import '../babel-plugin/commonAsync.js';
import '../babel-plugin/es6ImportHash.js';
import './global-variables.js';
import { loadModule } from './require.js';
import { insertNode } from './dependency-tree.js';

//注册serviceworker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { type: 'module' });
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
      await loadModule(data.module, null, data.content);

      const moduleExports = await window[data.module];
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
    if (window[data.module]) {
      try {
        const moduleExports = await window[data.module];
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
export const onReady = new Promise((resolve) => {
  onReadyResolve = resolve;
});

registerServiceWorker();

function connect(onConnect) {
  const parts = location.pathname.split('/');
  const i = parts.findIndex((item) => item === 'packages');
  const app = parts[i + 1];
  const ws = new WebSocket('ws://localhost:8442/' + app);
  ws.onmessage = async function (msg) {
    const data = JSON.parse(msg.data);
    if (data.type === 'init') {
      window._fs = data.data;
      const registration = await navigator.serviceWorker.ready;
      registration.active.postMessage({ type: 'fs', data: JSON.stringify(window._fs) });
      onConnect();
      return;
    }
    if (data.type === 'change') {
      window._fs = data.data.fs;
    }
  };
}
navigator.serviceWorker.ready.then((registration) => {
  registration.active.postMessage({ type: 'clearCache' });

  if (navigator.serviceWorker.controller) {
    connect(() => {
      onReadyResolve();
    });
  }
});
navigator.serviceWorker.oncontrollerchange = () => {
  connect(() => {
    onReadyResolve();
  });
};
