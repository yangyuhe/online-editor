const redirection = {
  'lodash-es': 'lodash'
};

define({
  load: async function (name, req, onload, config) {
    console.log(name)
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
          if (window.requirejsErrorOccured) {
            return;
          }

          let module
          if (redirection[name]) {
            module = redirection[name];
          }
          module = name.startsWith('/') ? name : '/node_modules/' + name

          const res = await util.getFileContent(module);

          if (!res) {
            req(
              [`pre${module}`],
              function (res) {
                console.log(`${module} pre found file`);
                onload(res);
              },
              (err) => {
                console.error(`${module} not found file`);
                onload({});
              },
            );

            return;
          }
          req(
            [`/loader/transform.js!${res.file}`],
            function (res) {
              onload(res);
            },
            function (err) {
              onload.error(err);
            },
          );
        })();
      },
      (err) => {
        console.log('5:', err);
      },
    );
  },
  name: 'common',
});
