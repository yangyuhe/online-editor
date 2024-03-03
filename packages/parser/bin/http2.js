#!/usr/bin/env node

const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const { startWS } = require('./ws');

const server = http2.createSecureServer({
  key: fs.readFileSync(path.resolve(__dirname, './key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, './cert.pem'))
});

startWS();

const root = process.cwd();

server.on('error', (err) => console.error(err));

server.on('stream', async (stream, headers) => {
  const pathname = headers[':path'];
  const okHeaders = {
    'content-type': 'application/json',
    ':status': 200,
    'Cache-Control': pathname.split('/').includes('node_modules') ? `max-age=1000000000` : undefined
  };

  if (pathname === '/sw.js') {
    let content = await fs.promises.readFile(path.resolve(__dirname, '../sw.js'), {
      encoding: 'utf8'
    });
    stream.respond({
      ...okHeaders,
      'content-type': 'text/javascript'
    });
    stream.end(content);
    return;
  }

  // if (pathname.startsWith('/$parser/')) {
  //   const fullPath = path.resolve(__dirname, '../', pathname.slice('/$parser/'.length));

  //   try {
  //     let content = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
  //     stream.respond({
  //       ...okHeaders,
  //       'content-type': 'text/javascript'
  //     });
  //     stream.end(content);
  //   } catch (err) {
  //     stream.respond({
  //       ...okHeaders,
  //       ':status': 404
  //     });
  //   }

  //   return;
  // }

  let fullPath = path.resolve(root, pathname.slice(1));

  try {
    let index = fullPath.indexOf('?query');
    if (index !== -1) fullPath = fullPath.slice(0, index);

    const ext = path.extname(fullPath);

    let content = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
    if (path.extname(fullPath) === '.html') {
      content = content.replace(
        '${importmap}',
        `<script type='importmap'>{
          "imports":{
            "$parser/":"/packages/parser/"
          }
      }</script>`
      );
    }
    if (ext === '.js') {
      stream.respond({
        ...okHeaders,
        'content-type': 'text/javascript'
      });
    }
    if (ext === '.css') {
      stream.respond({
        ...okHeaders,
        'content-type': 'text/css'
      });
    }
    stream.end(content);
  } catch (err) {
    console.error(err);
    stream.respond({
      ...okHeaders,
      ':status': 404
    });
    stream.end(JSON.stringify({ code: 1, msg: 'not found' }));
  }
});

server.listen(8443, () => {
  console.log('listening at 8443');
});
