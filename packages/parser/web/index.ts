import './global-variables.js';
import { loadModule } from './require';
import { Msg, MsgType } from '../common/types.js';

//注册serviceworker
const registerServiceWorker = async () => {
  if ('serviceWorker' in window.navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.error(`注册serviceworker失败`, error);
    }
  }
};

const taskCache: { [key: string]: { p: Promise<any>; resolve: any; reject: any } } = {};

export async function tunnelTask<Type>(msgType: MsgType, msgData: any, sw: ServiceWorker) {
  const msgKey = Date.now() + '.' + Math.random();
  if (taskCache[msgKey]) return taskCache[msgKey].p;
  let resolve, reject;
  const p = new Promise<Type>(async (_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  sw.postMessage({ msgType, msgData, msgKey } as Msg);
  taskCache[msgKey] = {
    p,
    resolve,
    reject
  };
  return p;
}

navigator.serviceWorker.onmessage = async (event: MessageEvent<Msg>) => {
  const { data: { msgType, msgData, msgKey } = {} } = event;
  if (msgType === MsgType.Echo && msgKey) {
    taskCache[msgKey].resolve(msgData);
    return;
  }

  if (msgType === MsgType.InitDone) {
    onReadyResolve();
    return;
  }
  const registration = await navigator.serviceWorker.ready;
  if (msgType === MsgType.GetModule) {
    try {
      await loadModule(msgData, registration.active);

      const moduleExports = await window[msgData];
      registration.active.postMessage({
        msgType: MsgType.Echo,
        msgData: {
          data: Object.keys(moduleExports),
          code: 0
        },
        msgKey: msgKey
      } as Msg);
    } catch (err) {
      registration.active.postMessage({
        msgType: MsgType.Echo,
        msgData: {
          data: null,
          code: -1,
          err
        },
        msgKey: msgKey
      } as Msg);
    }
  }
};

let onReadyResolve;
export const onReady = new Promise((resolve) => {
  onReadyResolve = resolve;
});

registerServiceWorker();

navigator.serviceWorker.ready.then((registration) => {
  console.log('ready', navigator.serviceWorker.controller);
  const matched = location.pathname.match(/\/api\/preview\/([^/]+)/);
  if (matched) {
    registration.active.postMessage({ msgType: MsgType.Init, msgData: matched[1] } as Msg);
  } else {
    console.error('没找到应用');
  }
});
navigator.serviceWorker.oncontrollerchange = () => {
  console.log('oncontrollerchange', navigator.serviceWorker.controller);
};
