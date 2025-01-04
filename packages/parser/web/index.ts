import './global-variables.js';
import { loadModule } from './require';
import { Msg, MsgType } from '../common/types.js';
import { taskCache } from './tunnelTask.js';

const channel = new BroadcastChannel('online_editor_channel');

//注册serviceworker
const registerServiceWorker = async () => {
  if ('serviceWorker' in globalThis.navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.error(`注册serviceworker失败`, error);
    }
  }
};

channel.addEventListener('message', async (event: MessageEvent<Msg>) => {
  const {
    data: { msgType, msgData, msgKey, from, target }
  } = event;
  if (target === location.href && from === 'sw') {
    if (msgType === MsgType.Echo && msgKey) {
      taskCache[msgKey].resolve(msgData);
      return;
    }

    if (msgType === MsgType.InitDone) {
      onReadyCallback('init');
      return;
    }
    if (msgType === MsgType.Update) {
      onReadyCallback('update');
      return;
    }
    if (msgType === MsgType.GetModule) {
      try {
        await loadModule(msgData, channel);

        const moduleExports = await globalThis[msgData];
        const msg: Msg = {
          msgType: MsgType.Echo,
          msgData: {
            data: Object.keys(moduleExports),
            code: 0
          },
          msgKey: msgKey,
          from: target,
          target: 'sw'
        };
        channel.postMessage(msg);
      } catch (err) {
        const msg: Msg = {
          msgType: MsgType.Echo,
          msgData: {
            data: null,
            code: -1,
            err
          },
          msgKey: msgKey,
          from: target,
          target: 'sw'
        };
        channel.postMessage(msg);
      }
    }
  }
});

let onReadyCallback: (eventType: 'init' | 'update') => void;
export const onReady = function (callbck: (eventType: 'init' | 'update') => void) {
  onReadyCallback = callbck;
};

registerServiceWorker();

navigator.serviceWorker.ready.then(() => {
  console.log('ready', navigator.serviceWorker.controller);
  if (globalThis.__preview_app) {
    const msg: Msg = {
      msgType: MsgType.Init,
      msgData: globalThis.__preview_app,
      from: location.href,
      target: 'sw'
    };
    channel.postMessage(msg);
  } else {
    console.error('没找到应用');
  }
});
navigator.serviceWorker.oncontrollerchange = () => {
  console.log('oncontrollerchange', navigator.serviceWorker.controller);
};

//代理Worker
class T extends globalThis.Worker {
  constructor(url, option) {
    const _url = typeof url === 'string' ? url : url.toString();
    super(_url + '?type=worker', option);
  }
}
globalThis.Worker = T;
