import '/vendors/babel.js';
import '/babel-plugin/commonAsync.js';

async function getClient(event) {
  const clientId = event.resultingClientId !== '' ? event.resultingClientId : event.clientId;
  const client = await self.clients.get(clientId);
  return client;
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
                    export default res;
                    ${keys.map((key) => `export const ${key}=res['${key}']`).join('\n')}
                    `;
  return text;
}

self.addEventListener('fetch', (event) => {
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

let isexistPromises = [];
async function findExisting(event, module) {
  const client = await getClient(event);
  const exist = isexistPromises.find((item) => item.module === module);
  if (exist) return exist.p;
  client.postMessage({ type: 'isexist', module: module });
  let item = { module };
  item.p = new Promise((resolve, reject) => {
    item.resolve = resolve;
    item.reject = reject;
    isexistPromises.push(item);
  });
  return item.p;
}

let caches = [];

addEventListener('message', (evt) => {
  const { data } = evt;
  if (data.type === 'getmodule') {
    const cache = caches.find((item) => item.url === data.module);
    if (data.code === 0) cache.resolve(data.data);
    else cache.reject(data.error);
  }

  if (data.type === 'clearCache') {
    caches = [];
    isexistPromises = [];
  }
  if (data.type === 'isexist') {
    const p = isexistPromises.find((item) => data.module === item.module);
    if (data.code === 0) p.resolve(data.data);
    else p.reject(new Error('no existing ' + data.module));
  }
});

async function respond(event) {
  const { request } = event;
  try {
    let url = new URL(request.url);
    if (request.url.includes('?content')) {
      const real = request.url.slice(0, -'?content'.length);
      return fetch(real);
    }
    if (request.url.includes('/api/') || request.url.endsWith('.html')) {
      return fetch(request);
    }
    if (!/\.(jsx?|tsx?|css|html)$/.test(url.pathname)) {
      const response = await fetch(`/api/file?module=${url.pathname}`);
      const res = await response.json();
      if (!res.data) {
        return new Response(`找不到模块${url.pathname}`, {
          status: 404,
          headers: {
            'Content-Type': 'text/javascript;charset=utf-8'
          }
        });
      }

      return new Response(res.data.content, {
        status: 302,
        headers: {
          'Content-Type': 'text/javascript',
          Location: res.data.file
        }
      });
    }

    if (request.url.includes('/node_modules/')) {
      try {
        console.log('request.url:', request.url);
        const keys = await findExisting(event, request.url);
        const text = generateEsm(request.url, keys);
        return new Response(text, {
          status: 200,
          headers: {
            'Content-Type': 'text/javascript'
          }
        });
      } catch (err) {
        console.log('request.url-server:', err);
      }
    }

    if (request.url.endsWith('.css')) {
      const transformed = `
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '${request.url}?content';
            document.head.append(link);
            `;
      return new Response(transformed, {
        status: 200,
        headers: {
          'Content-Type': 'text/javascript'
        }
      });
    }

    const responseFromNetwork = await fetch(request.clone());

    const text = await responseFromNetwork.text();
    const ises6 = isEs6(text);
    const iscommonjs = isCommonjs(text);

    if (/\.(j|t)sx$/.test(request.url)) {
      let res = Babel.transform(text, { presets: ['jsx'] });

      let resCode = injectWindow(res.code, request.url);
      return new Response(resCode, {
        status: 200,
        headers: { 'Content-Type': 'text/javascript' }
      });
    }
    if (/\.(j|t)s$/.test(request.url)) {
      if (ises6) {
        let resCode = injectWindow(text, request.url);
        return new Response(resCode, {
          status: 200,
          headers: { 'Content-Type': 'text/javascript' }
        });
      } else if (iscommonjs && request.url.includes('node_modules')) {
        try {
          const client = await getClient(event);
          client.postMessage({ type: 'getmodule', module: request.url });

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

          const text = generateEsm(request.url, keys);
          return new Response(text, {
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
    return new Response(error?.message, {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

self.addEventListener('install', (evt) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
