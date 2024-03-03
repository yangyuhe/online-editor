import { insertNode } from './dependency-tree.js';
import { calcuPath } from './calcuPath.js';

/**
 * moduleRequired 模块的绝对路径
 */
export async function loadModule(moduleRequired, parent = null, content = null) {
  if (parent) {
    insertNode(parent, moduleRequired);
  }
  const requiredModule = moduleRequired.endsWith('.js') ? moduleRequired : moduleRequired + '.js';
  if (!window[requiredModule]) {
    window[requiredModule] = new Promise(async (resolve, reject) => {
      try {
        if (/\.(j|t)sx$/.test(requiredModule)) {
          const res = await import(requiredModule);
          resolve(res);
          return;
        }

        let text = '';
        if (!content) {
          const res = await fetch(requiredModule + '?content');
          if (res.status === 404) {
            reject(new Error('not found ' + requiredModule));
            return;
          }
          text = await res.text();
        } else text = content;

        if (isEs6(text)) {
          const res = await import(requiredModule);
          resolve(res);
          return;
        } else {
          const code = Babel.transform(text, { plugins: ['commonAsync'] }).code;
          const AsyncFunction = (async () => {}).constructor;
          const fn = new AsyncFunction('module', 'exports', 'require', code);
          const module = { exports: {} };

          await fn(module, module.exports, async (module) => {
            const fullPath = calcuPath(requiredModule, module, window._fs);
            if (fullPath) return loadModule(location.origin + fullPath, moduleRequired, null);
            else throw new Error('没有找到依赖的子模块' + module);
          });
          resolve(module.exports);
          return;
        }
      } catch (err) {
        reject(err);
      }
    });
    let finish = false;
    window[requiredModule].finally(() => {
      finish = true;
    });
    setTimeout(() => {
      if (!finish) console.error(`模块${requiredModule}加载超时`);
    }, 10000);
  }
  return window[requiredModule];
}

function isEs6(text) {
  const es6 = text
    .split('\n')
    .some((line) => line.startsWith('export ') || text.startsWith('import '));
  return es6;
}
