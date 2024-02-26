#!/usr/bin/env node

const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const server = http2.createSecureServer({
  key: fs.readFileSync(path.resolve(__dirname, './localhost-privkey.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, './localhost-cert.pem')),
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
  if (pathname.startsWith('/api/file?')) {
    let filename = pathname.substr('/api/file?'.length).split("=")[1]
    if (!filename.startsWith("/"))
      filename = '/node_modules/' + filename

    if (filename.startsWith("/")) filename = filename.substr(1)

    const rootDir = path.resolve(__dirname, "..")
    const getRelative = (p) => '/' + path.relative(rootDir, p)
    filename = path.resolve(__dirname, '..', filename);

    async function checkOrigin() {
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
      res = await checkOrigin()
    } else {
      async function checkPackageJson() {
        const package = await fs.promises.readFile(filename + '/package.json', { encoding: 'utf8' });
        const main = JSON.parse(package).main
        if (main) {
          const mainFile = path.resolve(filename, main);
          const mainFileContent = await fs.promises.readFile(mainFile, { encoding: 'utf8' });
          return { content: mainFileContent, file: getRelative(mainFile) };
        } else {
          throw new Error('next')
        }

      }

      async function checkIndex() {
        const dirs = await fs.promises.readdir(filename, { encoding: 'utf8' });
        const indexFile = dirs.find(item => /\.(t|j)sx?/.test(path.extname(item)) && !item.endsWith('.d.ts'))
        if (indexFile) {
          const indexFilePath = path.resolve(filename, indexFile)

          const indexFileContent = await fs.promises.readFile(indexFilePath, { encoding: 'utf8' });
          return { content: indexFileContent, file: getRelative(indexFilePath) };
        } else {
          throw new Error('next')
        }

      }

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

      res = await checkPackageJson().catch(checkIndex).catch(checkSelf).catch(err => {
        console.error(err)
        return null;
      })
    }
    stream.respond(okHeaders);
    stream.end(JSON.stringify({ code: 0, data: res }));
    return;
  }
  if (pathname === '/api/importmap') {
    stream.respond(okHeaders);
    const dirs = await fs.promises.readdir(path.resolve(__dirname, "../node_modules"), { encoding: 'utf8' });
    const importmaps = {}
    dirs.forEach(dir => {
      importmaps[dir] = "/node_modules/" + dir;
      importmaps[dir + '/'] = "/node_modules/" + dir + "/";
    })
    stream.end(JSON.stringify({ code: 0, data: importmaps }));
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
      const content = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
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

// const http=require("http")
// const server=http.createServer((req,res)=>{
//   res.write("hello")
//   res.end()
// })
// server.listen(8443)
