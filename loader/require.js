import { insertNode } from './dependency-tree.js';

let parentCaches = ['/node_modules/monaco-editor'];

window._window = new Proxy(
  {},
  {
    get(target, property) {
      return window.opener?.[property] || window[property];
    },
    set(target, property, val) {
      if (parentCaches.some((item) => property.includes(item))) {
        if (window.opener) window.opener[property] = val;
        else window[property] = val;
      } else window[property] = val;
      return true;
    }
  }
);

/**
 * moduleRequired 模块的绝对路径
 */
export async function loadModule(moduleRequired, parent = null) {
  if (parent) {
    insertNode(parent, moduleRequired);
  }
  const requiredModule = moduleRequired.endsWith('.js') ? moduleRequired : moduleRequired + '.js';
  if (!_window[requiredModule]) {
    _window[requiredModule] = new Promise(async (resolve, reject) => {
      try {
        if (/\.(j|t)sx$/.test(requiredModule)) {
          const res = await loadEs(requiredModule);
          resolve(res);
          return;
        }
        const res = await fetch(requiredModule + '?content');
        if (res.status !== 404) {
          const text = await res.text();
          if (isEs6(text)) {
            const res = await loadEs(requiredModule);
            resolve(res);
            return;
          } else {
            const code = Babel.transform(text, { plugins: ['commonAsync'] }).code;
            const AsyncFunction = (async () => {}).constructor;
            const fn = new AsyncFunction('module', 'exports', 'require', code);
            const module = { exports: {} };

            await fn(module, module.exports, async (module) => {
              if (module.startsWith('/')) {
                return loadModule(module, moduleRequired);
              }
              if (module.startsWith('./') || module.startsWith('../')) {
                const paths = module.split('/');
                const desPaths = requiredModule.split('/');
                desPaths.pop();
                while (true) {
                  let cur = paths.shift();
                  if (cur === undefined) break;
                  if (cur === '.') {
                    continue;
                  }
                  if (cur === '..') {
                    desPaths.pop();
                    continue;
                  }
                  desPaths.push(cur);
                }

                return loadModule(desPaths.join('/'), moduleRequired);
              }
              const res = await fetch('/api/file?module=' + module);
              const json = await res.json();
              if (json.data) return loadModule(location.origin + json.data.file, moduleRequired);
              else throw new Error('没有找到依赖的子模块' + module);
            });
            resolve(module.exports);
            return;
          }
        } else {
          reject(new Error('not found ' + requiredModule));
        }
      } catch (err) {
        reject(err);
      }
    });
    let finish = false;
    _window[requiredModule].finally(() => {
      finish = true;
    });
    setTimeout(() => {
      if (!finish) console.error(`模块${requiredModule}加载超时`);
    }, 10000);
  }
  return _window[requiredModule];
}

function isEs6(text) {
  const es6 = text
    .split('\n')
    .some((line) => line.startsWith('export ') || text.startsWith('import '));
  return es6;
}
