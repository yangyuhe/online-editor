#!/usr/bin/env node

const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const server = http2.createSecureServer({
  key: fs.readFileSync(path.resolve(__dirname, './key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, './cert.pem')),
});

const root = path.resolve(__dirname, '../');

server.on('error', (err) => console.error(err));

server.on('stream', async (stream, headers) => {
  const pathname = headers[':path'];
  const okHeaders = {
    'content-type': 'application/json',
    ':status': 200,
    'Cache-Control': pathname.split('/').includes('node_modules') ? `max-age=1000000000` : undefined
  }

  //这个接口用于提供对模块的绝对路径的解析
  if (pathname.startsWith('/api/file?')) {
    let filename = pathname.substr('/api/file?'.length).split("=")[1]
    if (!filename.startsWith("/"))
      filename = '/node_modules/' + filename

    if (filename.startsWith("/")) filename = filename.substr(1)
    filename = path.resolve(__dirname, '..', filename);

    const rootDir = path.resolve(__dirname, "..")
    const getRelative = (p) => '/' + path.relative(rootDir, p)

    /**检查是否存在对应路径的文件 */
    async function checkAbsolute() {
      try {
        const content = await fs.promises.readFile(filename, { encoding: 'utf8' });
        return { content, file: getRelative(filename) };
      } catch (err) {
        console.error(err)
        return null;
      }
    }
    let res;
    if (/(\.(tsx?|jsx?|css))/.test(path.extname(filename))) {
      res = await checkAbsolute()
    } else {
      /**检查是否存在对应的包 */
      async function checkPackage() {
        const package = JSON.parse(await fs.promises.readFile(filename + '/package.json', { encoding: 'utf8' }));
        let main = package.browser || package.module || package.main
        if (package.browser && typeof package.browser === 'string')
          main = package.browser;
        if (main) {
          if (!/\.js$/.test(main)) main = main + '.js';
          const mainFile = path.resolve(filename, main);
          const mainFileContent = await fs.promises.readFile(mainFile, { encoding: 'utf8' });
          return { content: mainFileContent, file: getRelative(mainFile) };
        } else {
          throw new Error('next')
        }

      }

      /**检查是否省略的index文件 */
      async function checkIndex() {
        const dirs = await fs.promises.readdir(filename, { encoding: 'utf8' });
        const indexFile = dirs.find(item => item.startsWith('index.') && /\.(t|j)sx?$/.test(path.extname(item)) && !item.endsWith('.d.ts'))
        if (indexFile) {
          const indexFilePath = path.resolve(filename, indexFile)

          const indexFileContent = await fs.promises.readFile(indexFilePath, { encoding: 'utf8' });
          return { content: indexFileContent, file: getRelative(indexFilePath) };
        } else {
          throw new Error('next')
        }
      }

      /**检查是否存在省略了扩展名的情况 */
      async function checkSelf() {
        const parentDir = path.dirname(filename)
        const fileName = filename.substr(parentDir.length + 1)
        const dirs = await fs.promises.readdir(parentDir, { encoding: 'utf8' });
        const selfFile = dirs.find(item => new RegExp('^' + fileName + '\\.(j|t)sx?$').test(item))
        if (selfFile) {
          const selfFilePath = path.resolve(parentDir, selfFile)

          const selfFileContent = await fs.promises.readFile(selfFilePath, { encoding: 'utf8' });
          return { content: selfFileContent, file: getRelative(selfFilePath) };
        } else {
          throw new Error('next')
        }
      }

      res = await checkPackage().catch(checkIndex).catch(checkSelf).catch(err => {
        console.error(err)
        return null;
      })
    }
    stream.respond(okHeaders);
    stream.end(JSON.stringify({ code: 0, data: res }));
    return;
  }

  const fullPath = path.resolve(root, pathname.slice(1));

  try {
    const stats = await fs.promises.stat(fullPath);

    if (stats.isDirectory()) {
      const dirs = await fs.promises.readdir(fullPath, { encoding: 'utf8' });
      stream.end(JSON.stringify({ code: 0, data: dirs }));
    } else {
      const ext = path.extname(fullPath);

      if (ext === '.js') {
        stream.respond({
          ...okHeaders,
          'content-type': 'text/javascript',
        });
      }
      if (ext === '.css') {
        stream.respond({
          ...okHeaders,
          'content-type': 'text/css'
        });
      }
      let content = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
      if (ext === '.html' && content.includes('<%= importmap %>')) {
        const dirs = await fs.promises.readdir(path.resolve(__dirname, "../node_modules"), { encoding: 'utf8' });
        const importmaps = {}
        dirs.forEach(dir => {
          importmaps[dir] = "/node_modules/" + dir;
          importmaps[dir + '/'] = "/node_modules/" + dir + "/";
        })
        content = content.replace('<%= importmap %>', `<script type="importmap">{
      "imports":${JSON.stringify(importmaps)}
      }</script>`)
      }
      stream.end(content);
    }
  } catch (err) {
    console.error(err);
    stream.respond({
      ...okHeaders,
      ':status': 404,
    });
    stream.end(JSON.stringify({ code: 1, msg: 'not found' }));
  }
});

server.listen(8443, () => {
  console.log("listening at 8443")
});
