/**
 * 用于将commonjs模块的同步的require方法转化为异步的require
 * 例如const lodash=require('lodash') => const lodash=await require('lodash')
 */

function replaceParent(path, t) {
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
              replaceParent(item.parentPath, t);
            }
          });
        }
      }
    }
    if (t.isFunctionExpression(fnParent.node)) {
      if (t.isCallExpression(fnParent.parent)) {
        fnParent.parentPath.replaceWith(t.awaitExpression(fnParent.parent));
        replaceParent(fnParent.parentPath, t);
      }
    }
  }
}

function isExportFunction(path) {
  let parent = path.getFunctionParent();
  while (parent?.getFunctionParent()) parent = parent.getFunctionParent();
  if (!parent) return false;
  const p = parent.findParent((path) => {
    return path.isAssignmentExpression();
  });
  if (!p) return false;
  let left = p.get('left').node;
  if (left.object.name === 'module' || left.object.object.name === 'module') return true;
  return false;
}

function commonAsync(babel) {
  const t = babel.types;
  let program;
  let dealedNodes = [];
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
          replaceParent(path, t);
          path.replaceWith(t.awaitExpression(path.node));
        }
        dealedNodes.push(path.node);
      }
    }
  };
  return { visitor };
}

Babel.registerPlugin('commonAsync', commonAsync);
