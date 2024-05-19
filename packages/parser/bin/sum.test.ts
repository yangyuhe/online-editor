import { test } from '@jest/globals';
import path from 'path';
import { listFiles } from './listFiles';

test('scanDir test', async () => {
  const rootPath = path.resolve(process.cwd(), '../web/playground/demos/old-react-test');
  const prefix = path.resolve(process.cwd(), '../web/playground/node_modules/.pnpm');
  const dirs = await listFiles(rootPath, prefix);
  console.log(dirs);
});
