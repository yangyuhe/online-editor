function transform(babel) {
  const t = babel.types;
  let requires = [];
  let counter = 0;
  const visitor = {
    Program: {
      exit(path) {
        const oldBody = [...path.node.body];
        path.get('body').forEach((p) => p.remove());

        const moduleDeclare = t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier('module'),
            t.objectExpression([t.objectProperty(t.identifier('exports'), t.objectExpression([]))]),
          ),
        ]);
        const exportsDeclare = t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier('exports'),
            t.memberExpression(t.identifier('module'), t.identifier('exports')),
          ),
        ]);
        const returnExports = t.returnStatement(
          t.memberExpression(t.identifier('module'), t.identifier('exports')),
        );
        path.unshiftContainer(
          'body',
          t.callExpression(t.identifier('define'), [
            t.arrayExpression(
              requires.map((i) => t.stringLiteral(`/loader/common.js!${i.require}`)),
            ),
            t.functionExpression(
              null,
              requires.map((i) => t.identifier(i.newExp)),
              t.blockStatement([moduleDeclare, exportsDeclare, ...oldBody, returnExports]),
            ),
          ]),
        );
        path.stop();
        counter = 0;
        requires = [];
      },
    },
    Identifier(path) {
      if (path.node.name === 'require') {
        console.log(path.isReferencedIdentifier());
      }
    },
    CallExpression(path) {
      const noRerence = (p) => {
        let cur = p.scope;
        while (cur) {
          if (cur.bindings?.['require']) {
            return false;
          }
          cur = cur.parent;
        }
        return true;
      };
      if (
        path.node.arguments.length === 1 &&
        path.node.callee.name === 'require' &&
        path.node.arguments[0].type === 'StringLiteral' &&
        noRerence(path)
      ) {
        const newExp = `easy$$replace_${counter++}`;
        requires.push({ require: path.node.arguments[0].value, newExp });
        path.replaceWithSourceString(newExp);
      }
    },
  };
  return { visitor };
}

Babel.registerPlugin('cjs2amd', transform);
