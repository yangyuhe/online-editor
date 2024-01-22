let umdTime = 0
let es6TimeEnv = 0
let es6Prefix = 0
let commonjsTime = 0
define({
  load: async function (name, req, onload, config) {
    if (name.includes('!')) {
      req(
        [name],
        (res) => {
          onload(res);
        },
        (err) => {
          onload.error(err);
        },
      );
      return;
    }
    req(
      ['/loader/util.js'],
      function (util) {
        (async () => {
          const fullPath = name;
          //解析css
          if (
            fullPath.endsWith('.css') ||
            fullPath.endsWith('.scss') ||
            fullPath.endsWith('.less')
          ) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fullPath;
            document.head.append(link);
            onload({});

            return;
          }

          //解析json
          if (fullPath.endsWith('.json')) {
            const text = (await util.getFileContent(fullPath)).content;
            onload(new Function(`return ${text}`)());
            return;
          }

          //解析svg
          if (fullPath.endsWith('.svg')) {
            const text = (await util.getFileContent(fullPath)).content;
            onload(`data:image/svg+xml;utf8,${text}`);
            return;
          }

          //解析gql
          if (fullPath.endsWith('.gql')) {
            const text = (await util.getFileContent(fullPath)).content;
            require(['/loader/common.js?remove!node_modules/graphql-tag/loader.js'], (loader) => {
              onload(loader(text));
            }, (err) => {
              debugger;
            });

            return;
          }

          //其他js
          const text = (await util.getFileContent(fullPath)).content;
          const isUmd = text.includes('typeof define');
          const isEs6 = text
            .split('\n')
            .some((line) => line.startsWith('export ') || text.startsWith('import '));



          window.__curModule = fullPath;
          const sourcemap = {
            sourceMaps: 'both',
            sourceFileName: fullPath,
          };
          if (isEs6 || fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx')) {
            let start = Date.now()
            let res;
            if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx')) {
              res = Babel.transform(text, {
                presets: ['amd-plus'],
                ...sourcemap,
              });
              es6TimeEnv += Date.now() - start;
              start = Date.now()
              const res2 = Babel.transform(res.code, {
                plugins: ['addprefix'],
                ...sourcemap,
              });
              es6Prefix += Date.now() - start;
              onload.fromText(res2.code);
            }
            else
              window.loadEs(fullPath).then(res => {
                onload(res)
              }).catch(err => {
                debugger
                onload.error(err)
              })
          } else if (isUmd) {
            let start = Date.now()
            const res = Babel.transform(text, {
              plugins: ['addprefix'],
              ...sourcemap,
            });
            umdTime += Date.now() - start;
            onload.fromText(res.code);
          } else {
            let start = Date.now()
            const res = Babel.transform(text, {
              plugins: [
                'cjs2amd',
                config.common?.remove === true ? 'removeWebpackApi' : false,
              ].filter(Boolean),
              retainLines: true,
              ...sourcemap,
            });
            commonjsTime += Date.now() - start;
            onload.fromText(res.code);
          }
          return;
        })();
      },
      (err) => {
        console.log('5:', err);
      },
    );
  },
  name: 'common',
});
