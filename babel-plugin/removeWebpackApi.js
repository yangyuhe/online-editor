function transform(babel) {
  const t = babel.types;
  const visitor = {
    CallExpression(path) {
      if (
        t.isMemberExpression(path.node.callee) &&
        t.isThisExpression(path.node.callee.object) &&
        path.node.callee.property.name === 'cacheable'
      ) {
        path.remove();
      }
    },
  };
  return { visitor };
}

Babel.registerPlugin('removeWebpackApi', transform);
