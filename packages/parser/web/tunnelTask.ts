import { Msg, MsgType } from '../common/types';

export const taskCache: { [key: string]: { p: Promise<any>; resolve: any; reject: any } } = {};

export async function tunnelTask<Type>(msgType: MsgType, msgData: any, sw: BroadcastChannel) {
  const msgKey = Date.now() + '.' + Math.random();
  if (taskCache[msgKey]) return taskCache[msgKey].p;
  let resolve, reject;
  const p = new Promise<Type>(async (_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  const msg: Msg = { msgType, msgData, msgKey, target: 'sw', from: globalThis.location.href };
  sw.postMessage(msg);
  taskCache[msgKey] = {
    p,
    resolve,
    reject
  };
  return p;
}
