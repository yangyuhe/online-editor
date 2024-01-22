function addPrefix(babel) {
  const t = babel.types;
  let requires = [];
  const visitor = {
    Program: {
      enter() {
        requires = [];
      },
      exit(path) {
        if (requires.length > 0) {
          path.traverse({
            CallExpression(p) {
              if (p.node.callee.name === 'define') {
                p.node.arguments = [...p.node.arguments, ...requires];
              }
            },
          });
        }
      },
    },
    CallExpression: {
      exit(path) {
        if (path.node.callee.name === 'eval') {
          const arg = path.node.arguments[0];

          const res = Babel.transform(arg.value, {
            plugins: ['prefixcommon', { requires }],
          });
          arg.value = res.code;
          return;
        }
        if (path.node.callee.name === 'require') {
          const arg = path.node.arguments[0];
          const mod = `/loader/common.js!${arg.value}`;
          arg.value = mod;
          requires.push(mod);
          return;
        }
        if (path.node.callee.name === '_require') {
          const arg = path.node.arguments[0];
          arg.elements.forEach(ele => {
            ele.value = '/loader/common.js!' + ele.value
          })
          return;
        }
        if (path.node.callee.name === 'define') {
          const args = path.node.arguments;
          args[0].elements?.forEach((item) => {
            if (!['exports', 'require', 'module'].includes(item.value)) {
              item.value = `/loader/common.js!${item.value}`;
            }
          });
          return;
        }
      },
    },
  };
  return { visitor };
}

function prefixCommon(babel, options) {
  const { requires } = options;
  const t = babel.types;
  const visitor = {
    CallExpression(path) {
      if (path.node.callee.name === 'require') {
        const arg = path.node.arguments[0];
        const mod = `/loader/common.js!${arg.value}`;
        arg.value = mod;
        requires.push(mod);
      }
    },
  };
  return { visitor };
}

Babel.registerPlugin('prefixcommon', prefixCommon);
Babel.registerPlugin('addprefix', addPrefix);
