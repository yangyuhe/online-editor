import { log } from './util';
import { add } from './add';
console.log('navigator.serviceWorker:');
console.log(globalThis.client);
log();
add(3, 4);
debugger;
console.log('this is worker');
self.postMessage('this is worker');
// import('./add').then((res) => {
//   res.add(3, 4);
// });
