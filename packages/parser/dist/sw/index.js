import * as Babel from '@babel/standalone';
import '@/common/babel-plugin';
import { getFileData, calculateAbsolutePath
// extractFromFsData
 } from '@/common/util';
import { MsgType, PathPrefix } from '../common/types';
import mime from 'mime';
const globalSelf = self;
const channel = new BroadcastChannel('online_editor_channel');
async function getClient(event) {
    const clientId = event.resultingClientId !== '' ? event.resultingClientId : event.clientId;
    try {
        const clientList = await globalSelf.clients.matchAll({
            includeUncontrolled: true,
            type: 'all'
        });
        const client = clientList.find((client) => client.id === clientId);
        return client;
    }
    catch (err) {
        console.log(err);
    }
}
function injectWindow(code, moduleName) {
    return (code +
        `\nimport('${moduleName}').then(res=>{
        globalThis['${moduleName}']=res;
    });`);
}
function generateEsm(url, keys) {
    const text = `const  res=await globalThis['${url}'];
                    ${keys.includes('default') ? 'export default res.default;' : 'export default res;'}
                    ${keys
        .filter((key) => key !== 'default')
        .map((key) => `export const ${key}=res['${key}']`)
        .join('\n')}
                    `;
    return text;
}
Babel.registerPreset('jsx', {
    presets: [
        [Babel.availablePresets['react']],
        [Babel.availablePresets['typescript'], { isTSX: true, allExtensions: true }]
    ]
});
function isEs6(text) {
    const es6 = text
        .split('\n')
        .some((line) => line.startsWith('export ') || line.startsWith('import '));
    return es6;
}
function isCommonjs(text) {
    const commonjs = text
        .split('\n')
        .some((line) => line.includes("require('") || line.includes('require("') || line.includes('exports'));
    return commonjs;
}
const taskCache = {};
const appFsData = {};
// const appTinyFsData: { [appName: string]: FsData } = {};
/**
 *
 * @param fileUrl 如http://localhost:3000/old-react-test/$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
 */
function getContentByUrl(fileUrl) {
    const url = new URL(fileUrl);
    const res = url.pathname.split('/');
    const appName = res[1];
    res[1] = null;
    const filePath = res.filter((item) => item !== null).join('/');
    const file = getFileData(appFsData[appName].fs, filePath);
    return file.content;
}
channel.addEventListener('message', (evt) => {
    const { data: { msgType, msgData, msgKey, from, target } = {} } = evt;
    if (target === 'sw') {
        if (msgType === MsgType.Echo && msgKey) {
            taskCache[msgKey].resolve(msgData);
            return;
        }
        if (msgType === MsgType.Init) {
            const appName = msgData;
            if (!appFsData[appName] ||
                !appFsData[appName].eventSource ||
                appFsData[appName].eventSource.readyState === EventSource.CLOSED ||
                !appFsData[appName].fs) {
                if (appFsData[appName]?.eventSource) {
                    appFsData[appName].eventSource.close();
                }
                const eventSource = new EventSource('/api/sse?project=' + appName);
                eventSource.addEventListener('message', (event) => {
                    const fs = JSON.parse(event.data);
                    const msgType = appFsData[appName].fs ? MsgType.Update : MsgType.InitDone;
                    appFsData[appName].fs = fs;
                    // const tinyFs = extractFromFsData(fs);
                    // appTinyFsData[appName] = tinyFs;
                    const msg = {
                        msgType,
                        from: 'sw',
                        target: from
                        // msgData: tinyFs
                    };
                    channel.postMessage(msg);
                });
                eventSource.addEventListener('error', (evt) => {
                    console.error('sse error', evt);
                    eventSource.close();
                    appFsData[appName].eventSource = null;
                });
                appFsData[appName] = {
                    eventSource,
                    fs: null
                };
            }
            else {
                const msg = {
                    msgType: MsgType.InitDone,
                    from: 'sw',
                    target: from
                    // msgData: appTinyFsData[appName]
                };
                channel.postMessage(msg);
            }
            return;
        }
        if (msgType === MsgType.GetFileContent) {
            const text = getContentByUrl(msgData);
            const msg = { msgType: MsgType.Echo, msgKey, msgData: text, from: 'sw', target: from };
            channel.postMessage(msg);
            return;
        }
        if (msgType === MsgType.CalcuPath) {
            //curPath  http://localhost:3000/old-react-test/$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
            //requiredModule ./cjs/react.development.js
            const { curPath, requiredModule } = msgData;
            const url = new URL(curPath);
            const res = url.pathname.split('/');
            const appName = res.splice(1, 1)[0];
            const destFile = calculateAbsolutePath(requiredModule, res.join('/'), appFsData[appName].fs);
            const msg = {
                msgType: MsgType.Echo,
                msgKey,
                msgData: '/' + appName + destFile,
                from: 'sw',
                target: from
            };
            channel.postMessage(msg);
            return;
        }
    }
});
/**
 *
 * @param msgType 如GetModule
 * @param msgData 如http://localhost:3000/old-react-test/$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
 * @param msgKey 如http://localhost:3000/old-react-test/$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
 * @param event
 * @returns
 */
async function tunnelTask(msgType, msgData, event) {
    const msgKey = Date.now() + '.' + Math.random();
    if (taskCache[msgKey])
        return taskCache[msgKey].p;
    const p = new Promise(async (resolve, reject) => {
        const client = await getClient(event);
        const msg = { msgType, msgData, msgKey, target: client.url, from: 'sw' };
        channel.postMessage(msg);
        taskCache[msgKey] = {
            p,
            resolve,
            reject
        };
    });
    return p;
}
globalSelf.addEventListener('fetch', (event) => {
    console.log('record:', event.request.url);
    const { request } = event;
    const url = new URL(request.url);
    if (!url.pathname.includes(PathPrefix.NODE_MODULES) &&
        !url.pathname.includes(PathPrefix.SRC) &&
        !url.pathname.includes(PathPrefix.PUBLIC)) {
        return;
    }
    event.respondWith(respond(event));
});
async function respond(event) {
    const { request } = event;
    console.log('sw event:', event);
    try {
        const url = new URL(request.url);
        if (url.pathname.includes(PathPrefix.PUBLIC)) {
            const appName = new URL(request.referrer).pathname.split('/').pop();
            const content = getContentByUrl(request.url.replace(PathPrefix.PUBLIC, '/' + appName + '/$$SRC/public'));
            return new Response(content, {
                headers: {
                    'Content-Type': url.pathname.match(/\.(t|j)sx?$/)
                        ? 'application/javascript'
                        : mime.getType(url.pathname)
                }
            });
        }
        if (url.search === '?type=worker') {
            const content = `
      import "/worker.js"
      import("${url.pathname}");
      `;
            return new Response(content, {
                headers: {
                    'Content-Type': url.pathname.match(/\.(t|j)sx?$/)
                        ? 'application/javascript'
                        : mime.getType(url.pathname)
                }
            });
        }
        if (url.pathname.endsWith('.css')) {
            const text = getContentByUrl(request.url);
            const transformed = [
                'const style=document.createElement("style");',
                'style.innerHTML=',
                JSON.stringify(text) + ';',
                'document.head.appendChild(style);'
            ].join('\n');
            return new Response(transformed, {
                status: 200,
                headers: {
                    'Content-Type': 'text/javascript'
                }
            });
        }
        const res = url.pathname.split('/');
        const appName = res[1];
        const text = getContentByUrl(request.url);
        const ises6 = isEs6(text);
        const iscommonjs = isCommonjs(text);
        if (/\.(j|t)sx$/.test(url.pathname) || ises6) {
            let code = '';
            const res = Babel.transform(text, {
                presets: ['jsx'],
                plugins: [
                    ['es6ImportAbsolute', { fs: appFsData[appName].fs, referrer: url.pathname }],
                    url.search && !url.pathname.includes('/node_modules')
                        ? ['es6ImportHash', { query: url.search }]
                        : null
                    // ['workerTransform', { referPath: url.pathname }]
                ].filter(Boolean)
            });
            code = res.code;
            const resCode = injectWindow(code, request.url);
            return new Response(resCode, {
                status: 200,
                headers: { 'Content-Type': 'text/javascript' }
            });
        }
        if (/\.(j|t)s$/.test(url.pathname) && iscommonjs) {
            try {
                const res = await tunnelTask(MsgType.GetModule, request.url, event);
                if (res.code !== 0) {
                    throw res.err;
                }
                const esm = generateEsm(request.url, res.data);
                return new Response(esm, {
                    status: 200,
                    headers: { 'Content-Type': 'text/javascript' }
                });
            }
            catch (err) {
                console.error('获取commonjs模块失败', err);
                return new Response(err.message, {
                    status: 404,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        }
        return new Response(text, {
            status: 200,
            headers: { 'Content-Type': 'text/javascript' }
        });
    }
    catch (error) {
        console.error(error);
        return new Response(error?.message, {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
globalSelf.addEventListener('install', () => {
    console.log('sw install');
    globalSelf.skipWaiting();
});
globalSelf.addEventListener('activate', (event) => {
    console.log('sw active');
    event.waitUntil(globalSelf.clients.claim());
});
