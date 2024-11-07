globalThis.process = globalThis.process || {};
Object.assign(globalThis.process, {
  env: {
    NODE_ENV: 'development'
  }
});
