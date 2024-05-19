import Babel from '@babel/standalone';
import './babel-plugin/commonAsync.js';
import './babel-plugin/es6ImportHash.js';
import './babel-plugin/es6ImportAbsolute.js';
import { ListFileData } from '../types';
import { getSrcFile } from '../common/fsUtil';

const globalSelf = self as unknown as ServiceWorkerGlobalScope;

let fs: ListFileData;
const appName = '';

const eventSource = new EventSource('/api/sse');
eventSource.addEventListener('message', (event) => {
  console.log(event.data);
  fs = JSON.parse(event.data);
});
eventSource.addEventListener('error', (evt) => {
  console.error('sse error', evt);
});

async function getClient(event: FetchEvent) {
  const clientId = event.resultingClientId !== '' ? event.resultingClientId : event.clientId;
  try {
    const clientList = await globalSelf.clients.matchAll();
    const client = clientList.find((client) => client.id === clientId);
    return client;
  } catch (err) {
    console.log(err);
  }
}
function injectWindow(code, moduleName) {
  return (
    code +
    `\nimport('${moduleName}').then(res=>{
        window['${moduleName}']=res;
    });`
  );
}

function generateEsm(url, keys) {
  const text = `const  res=await window['${url}'];
                    ${keys.includes('default') ? 'export default res.default;' : 'export default res;'}
                    ${keys
                      .filter((key) => key !== 'default')
                      .map((key) => `export const ${key}=res['${key}']`)
                      .join('\n')}
                    `;
  return text;
}

globalSelf.addEventListener('fetch', (event: FetchEvent) => {
  console.log('record:', event.request.url);
  event.respondWith(respond(event));
});

Babel.registerPreset('jsx', {
  presets: [
    [Babel.availablePresets['react']],
    [Babel.availablePresets['typescript'], { isTSX: true, allExtensions: true }]
  ]
});

function isEs6(text) {
  const es6 = text
    .split('\n')
    .some((line) => line.startsWith('export ') || text.startsWith('import '));
  return es6;
}
function isCommonjs(text) {
  const commonjs = text
    .split('\n')
    .some(
      (line) => line.includes("require('") || text.includes('require("') || text.includes('exports')
    );
  return commonjs;
}

// let isexistPromises = [];
// async function findExisting(event, module) {
//   const client = await getClient(event);
//   const exist = isexistPromises.find((item) => item.module === module);
//   if (exist) return exist.p;
//   client.postMessage({ type: 'isexist', module: module });
//   const item = { module };
//   item.p = new Promise((resolve, reject) => {
//     item.resolve = resolve;
//     item.reject = reject;
//     isexistPromises.push(item);
//   });
//   return item.p;
// }

const caches = [];
// const fsMap = {};

addEventListener('message', (evt) => {
  const { data } = evt;
  if (data.type === 'getmodule') {
    const cache = caches.find((item) => item.url === data.module);
    if (data.code === 0) cache.resolve(data.data);
    else cache.reject(data.error);
  }

  // if (data.type === 'clearCache') {
  //   caches = [];
  //   isexistPromises = [];
  // }
  // if (data.type === 'isexist') {
  //   const p = isexistPromises.find((item) => data.module === item.module);
  //   if (data.code === 0) p.resolve(data.data);
  //   else p.reject(new Error('no existing ' + data.module));
  // }
  // if (data.type === 'fs') {
  //   fsMap[evt.source.id] = JSON.parse(data.data);
  // }
});

async function respond(event: FetchEvent) {
  const { request } = event;

  // const client = await getClient(event);
  // if (client) {
  //   client.postMessage({ type: 'dependency', parent: request.referrer, child: request.url });
  // }

  try {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/preview/') || !appName) {
      return;
    }
    // if (url.search === '?content') {
    //   const real = request.url.slice(0, -'?content'.length);
    //   return fetch(real);
    // }
    // if (
    //   url.pathname.endsWith('.html') ||
    //   url.hostname !== 'localhost' ||
    //   url.pathname.startsWith('/parser')
    // ) {
    //   return fetch(request);
    // }

    // try {
    //   const keys = await findExisting(event, request.url);
    //   const text = generateEsm(request.url, keys);
    //   return new Response(text, {
    //     status: 200,
    //     headers: {
    //       'Content-Type': 'text/javascript'
    //     }
    //   });
    // } catch (err) {
    //   console.log('request.url-server:', err);
    // }

    if (url.pathname.endsWith('.css')) {
      const transformed = `
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '${url.pathname}?content';
            document.head.append(link);
            `;
      return new Response(transformed, {
        status: 200,
        headers: {
          'Content-Type': 'text/javascript'
        }
      });
    }

    const filePath = url.pathname.substring(('/api/preview/' + appName + '/').length);
    let text = '';
    if (filePath.startsWith('src/')) {
      text = getSrcFile(fs, filePath.slice('src/'.length)).content;
    }

    const ises6 = isEs6(text);
    const iscommonjs = isCommonjs(text);

    if (/\.(j|t)sx$/.test(url.pathname)) {
      let code = '';
      const res = Babel.transform(text, {
        presets: ['jsx'],
        plugins: [
          url.search && !url.pathname.includes('/node_modules')
            ? ['es6ImportHash', { query: url.search }]
            : null,
          ['es6ImportAbsolute', { fs, referrer: request.url }]
        ].filter(Boolean)
      });
      code = res.code;

      const resCode = injectWindow(code, request.url);
      return new Response(resCode, {
        status: 200,
        headers: { 'Content-Type': 'text/javascript' }
      });
    }
    if (/\.(j|t)s$/.test(url.pathname)) {
      if (ises6) {
        let code = '';
        const res = Babel.transform(text, {
          plugins: [
            url.search && !url.pathname.includes('/node_modules')
              ? ['es6ImportHash', { query: url.search }]
              : null,
            ['es6ImportAbsolute', { fs, referrer: request.url }]
          ].filter(Boolean)
        });
        code = res.code;

        const resCode = injectWindow(code, request.url);
        return new Response(resCode, {
          status: 200,
          headers: { 'Content-Type': 'text/javascript' }
        });
      } else if (iscommonjs && url.pathname.includes('node_modules')) {
        try {
          const client = await getClient(event);
          client.postMessage({ type: 'getmodule', module: request.url, content: text });

          let cache = caches.find((item) => item.url === request.url);
          let p;
          if (!cache) {
            cache = {};
            p = new Promise((resolve, reject) => {
              cache.resolve = resolve;
              cache.reject = reject;
              cache.url = request.url;
              caches.push(cache);
            });
            cache.p = p;
          } else p = cache.p;

          const keys = await p;

          const esm = generateEsm(request.url, keys);
          return new Response(esm, {
            status: 200,
            headers: { 'Content-Type': 'text/javascript' }
          });
        } catch (err) {
          console.error('获取commonjs模块失败', err);
          return new Response(err.message, {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }
    }
    return fetch(request);
  } catch (error) {
    console.error(error);
    return new Response(error?.message, {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

globalSelf.addEventListener('install', () => {
  globalSelf.skipWaiting();
});
globalSelf.addEventListener('activate', (event) => {
  event.waitUntil(globalSelf.clients.claim());
});
