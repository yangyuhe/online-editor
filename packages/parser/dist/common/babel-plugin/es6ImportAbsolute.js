import Babel from '@babel/standalone';
import { calculateAbsolutePath } from '../util';
function es6ImportAbsolute() {
    const visitor = {
        'ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration'(path, state) {
            if (path.node.source) {
                const val = path.node.source.value;
                const { fs, referrer } = state.opts;
                //val例如"react"
                const res = referrer.split('/');
                const appName = res.splice(1, 1)[0];
                let absolutePath = calculateAbsolutePath(val, res.join('/'), fs);
                absolutePath = '/' + appName + absolutePath;
                path.node.source.value = absolutePath;
            }
        },
        Import(path, state) {
            const val = path.parent.arguments[0].value;
            const { fs, referrer } = state.opts;
            path.parent.arguments[0].value = calculateAbsolutePath(val, referrer, fs);
        }
    };
    return { visitor };
}
Babel.registerPlugin('es6ImportAbsolute', es6ImportAbsolute);
