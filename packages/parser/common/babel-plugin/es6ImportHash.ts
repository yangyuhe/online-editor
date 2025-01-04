import { PluginPass } from '@babel/core';
import * as Babel from '@babel/standalone';
import { NodePath } from '@babel/traverse';
import { CallExpression, Import, ImportDeclaration, StringLiteral } from '@babel/types';
import { PathPrefix } from '../types';
function es6ImportHash() {
  const visitor = {
    ImportDeclaration(path: NodePath<ImportDeclaration>, state: PluginPass) {
      const val = path.node.source.value;
      const query = (state.opts as any).query;
      if (val.includes(PathPrefix.SRC) && !val.endsWith('.css')) {
        path.node.source.value = val + query;
      }
    },
    Import(path: NodePath<Import>, state: PluginPass) {
      const val = ((path.parent as CallExpression).arguments[0] as StringLiteral).value;
      const query = (state.opts as any).query;
      if (val.includes(PathPrefix.SRC) && !val.endsWith('.css')) {
        ((path.parent as CallExpression).arguments[0] as StringLiteral).value = val + query;
      }
    }
  };
  return { visitor };
}

Babel.registerPlugin('es6ImportHash', es6ImportHash);
