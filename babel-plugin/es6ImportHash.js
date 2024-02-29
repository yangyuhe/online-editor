function es6ImportHash(babel) {
  const t = babel.types;
  const visitor = {
    ImportDeclaration(path, state) {
      let val = path.node.source.value;
      if ((val.startsWith('./') || val.startsWith('../')) && !val.endsWith('.css')) {
        path.node.source.value = val + state.opts.query;
      }
    },
    Import(path, state) {
      const val = path.parent.arguments[0].value;
      if ((val.startsWith('./') || val.startsWith('../')) && !val.endsWith('.css')) {
        path.parent.arguments[0].value = val + state.opts.query;
      }
    }
  };
  return { visitor };
}

Babel.registerPlugin('es6ImportHash', es6ImportHash);
