import * as Babel from '@babel/standalone';
const t = Babel.packages.types;
function workerTransform() {
    const visitor = {
        NewExpression(path, state) {
            const referPath = state.opts.referPath;
            if (path.node.callee.name === 'Worker') {
                path.node.arguments.push(t.stringLiteral(referPath));
                console.log(path.scope);
            }
        }
    };
    return { visitor };
}
Babel.registerPlugin('workerTransform', workerTransform);
