import { log } from './util';
import { add } from './add';
console.log('navigator.serviceWorker:');
console.log(globalThis.client);
log();
add(3, 4);
// import('./add').then((res) => {
//   res.add(3, 4);
// });
