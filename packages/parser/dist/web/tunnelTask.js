export const taskCache = {};
export async function tunnelTask(msgType, msgData, sw) {
    const msgKey = Date.now() + '.' + Math.random();
    if (taskCache[msgKey])
        return taskCache[msgKey].p;
    let resolve, reject;
    const p = new Promise(async (_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    const msg = { msgType, msgData, msgKey, target: 'sw', from: globalThis.location.href };
    sw.postMessage(msg);
    taskCache[msgKey] = {
        p,
        resolve,
        reject
    };
    return p;
}
