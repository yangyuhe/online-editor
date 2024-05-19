import { calcuPath } from '../loader/calcuPath.js';
function es6ImportAbsolute() {
  const visitor = {
    'ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration'(path, state) {
      if (path.node.source) {
        let val = path.node.source.value;
        const { fs, referrer } = state.opts;
        const fullPath = calcuPath(referrer, val, fs);
        if (fullPath) path.node.source.value = fullPath;
        else throw new Error('es6ImportAbsolute 出错，val:' + val);
      }
    },
    Import(path, state) {
      const val = path.parent.arguments[0].value;
      const { fs, referrer } = state.opts;
      const fullPath = calcuPath(referrer, val, fs);
      if (fullPath) path.parent.arguments[0].value = fullPath;
      else throw new Error('es6ImportAbsolute import出错，val:', +val);
    }
  };
  return { visitor };
}

Babel.registerPlugin('es6ImportAbsolute', es6ImportAbsolute);
