import * as Babel from '@babel/standalone';
import { PathPrefix } from '../types';
function es6ImportHash() {
    const visitor = {
        ImportDeclaration(path, state) {
            const val = path.node.source.value;
            const query = state.opts.query;
            if (val.includes(PathPrefix.SRC) && !val.endsWith('.css')) {
                path.node.source.value = val + query;
            }
        },
        Import(path, state) {
            const val = path.parent.arguments[0].value;
            const query = state.opts.query;
            if (val.includes(PathPrefix.SRC) && !val.endsWith('.css')) {
                path.parent.arguments[0].value = val + query;
            }
        }
    };
    return { visitor };
}
Babel.registerPlugin('es6ImportHash', es6ImportHash);
