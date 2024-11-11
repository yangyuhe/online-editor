import * as Babel from '@babel/standalone';
import { PluginPass } from '@babel/core';
import { NodePath } from '@babel/traverse';
import { Identifier, NewExpression } from '@babel/types';

const t = Babel.packages.types;
function workerTransform() {
  const visitor = {
    NewExpression(path: NodePath<NewExpression>, state: PluginPass) {
      const referPath = (state.opts as any).referPath;
      if ((path.node.callee as Identifier).name === 'Worker') {
        path.node.arguments.push(t.stringLiteral(referPath));
        console.log(path.scope);
      }
    }
  };
  return { visitor };
}

Babel.registerPlugin('workerTransform', workerTransform);
