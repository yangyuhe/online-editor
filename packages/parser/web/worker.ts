import './global-variables.js';
import { loadModule } from './require';
import { Msg, MsgType } from '../common/types.js';
import { taskCache } from './tunnelTask';

const channel = new BroadcastChannel('online_editor_channel');
channel.addEventListener('message', async (event) => {
  const data: Msg = event.data;
  const { msgType, msgData, msgKey, from, target } = data;
  if (target === globalThis.location.href && from === 'sw') {
    if (msgType === MsgType.Echo && msgKey) {
      taskCache[msgKey].resolve(msgData);
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
          from: globalThis.location.href,
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
          from: globalThis.location.href,
          target: 'sw'
        };
        channel.postMessage(msg);
      }
    }
  }
});
