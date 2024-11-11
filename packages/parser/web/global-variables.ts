globalThis.process = globalThis.process || {};

let platform = '';
if (navigator.userAgent.indexOf('Windows') !== -1) platform = 'win32';
if (navigator.userAgent.indexOf('Macintosh') !== -1) platform = 'darwin';
if (navigator.userAgent.indexOf('Linux') !== -1) platform = 'linux';

Object.assign(globalThis.process, {
  env: {
    NODE_ENV: 'development'
  },
  platform
});
