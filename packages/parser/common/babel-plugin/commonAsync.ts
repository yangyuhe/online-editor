import * as Babel from '@babel/standalone';
import { NodePath } from '@babel/traverse';
import { Identifier, MemberExpression } from '@babel/types';

const t = Babel.packages.types;
Babel.packages.traverse.NodePath;
/**
 * 用于将commonjs模块的同步的require方法转化为异步的require
 * 例如const lodash=require('lodash') => const lodash=await require('lodash')
 */

function replaceParent(path: NodePath) {
  const fnParent = path.getFunctionParent();
  if (fnParent && !fnParent.node.async) {
    fnParent.node.async = true;
    if (t.isFunctionDeclaration(fnParent.node)) {
      const fnName = fnParent.node.id?.name;
      if (fnName && fnParent.scope.parent.bindings[fnName]) {
        const binding = fnParent.scope.parent.bindings[fnName];
        if (binding.path === fnParent) {
          binding.referencePaths.forEach((item) => {
            if (t.isCallExpression(item.parent) && !t.isAwaitExpression(item.parentPath.parent)) {
              item.parentPath.replaceWith(t.awaitExpression(item.parent));
              replaceParent(item.parentPath);
            }
          });
        }
      }
    }
    if (t.isFunctionExpression(fnParent.node)) {
      if (t.isCallExpression(fnParent.parent)) {
        fnParent.parentPath.replaceWith(t.awaitExpression(fnParent.parent));
        replaceParent(fnParent.parentPath);
      }
    }
  }
}

function isExportFunction(path: NodePath) {
  let parent = path.getFunctionParent();
  while (parent?.getFunctionParent()) parent = parent.getFunctionParent();
  if (!parent) return false;
  const p = parent.findParent((path) => {
    return path.isAssignmentExpression();
  });
  if (!p) return false;
  const left = (p.get('left') as NodePath).node as MemberExpression;
  if (
    (left.object as Identifier).name === 'module' ||
    ((left.object as MemberExpression).object as Identifier).name === 'module'
  )
    return true;
  return false;
}

function commonAsync() {
  let program;
  const dealedNodes = [];
  const visitor = {
    Program(path) {
      program = path;
    },
    CallExpression(path) {
      if (path.node.callee.name === 'require' && path.parent.type !== 'AwaitExpression') {
        const res = isExportFunction(path);
        if (res) {
          const parent = path.findParent((path) => {
            return path.parentPath?.isBlockStatement();
          });
          if (parent) {
            const node = parent.node;
            parent.remove();
            program.unshiftContainer('body', node);
          }
        } else {
          replaceParent(path);
          path.replaceWith(t.awaitExpression(path.node));
        }
        dealedNodes.push(path.node);
      }
    }
  };
  return { visitor };
}

Babel.registerPlugin('commonAsync', commonAsync);
