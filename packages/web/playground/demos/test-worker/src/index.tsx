const myWorker = new Worker(new URL('./sw/index.ts', import.meta.url), {
  type: 'module',
  name: 'test-worker'
});
myWorker.postMessage('hello1');
myWorker.addEventListener('message', (evt) => {
  console.log('---');
  console.log(evt);
});
