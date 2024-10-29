import Babel from '@babel/standalone';
import { FsData } from '../types';
import { calculateAbsolutePath } from '../util';
function es6ImportAbsolute() {
  const visitor = {
    //转换静态import
    'ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration'(path, state) {
      if (path.node.source) {
        const val = path.node.source.value;
        const { fs, referrer } = state.opts as {
          fs: FsData;
          //如 /old-react-test/$$NODE_MODULES/react@16.14.0/node_modules/react/index.js'
          referrer: string;
        };
        //val例如"react"
        const res = referrer.split('/');
        const appName = res.splice(1, 1)[0];

        let absolutePath = calculateAbsolutePath(val, res.join('/'), fs);
        absolutePath = '/' + appName + absolutePath;
        path.node.source.value = absolutePath;
      }
    },
    //转换动态import()
    Import(path, state) {
      const val = path.parent.arguments[0].value;
      const { fs, referrer } = state.opts;

      const res = referrer.split('/');
      const appName = res.splice(1, 1)[0];

      let absolutePath = calculateAbsolutePath(val, res.join('/'), fs);
      absolutePath = '/' + appName + absolutePath;

      path.parent.arguments[0].value = absolutePath;
    }
  };
  return { visitor };
}

Babel.registerPlugin('es6ImportAbsolute', es6ImportAbsolute);
