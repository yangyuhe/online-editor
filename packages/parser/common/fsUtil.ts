import { ListFileData } from '../types';

export function getSrcFile(fs: ListFileData, path: string) {
  let files = fs.src;
  const slices = path.split('/');
  while (true) {
    const top = slices.pop();
    const child = files.find((file) => file.name === top);
    if (slices.length === 0) {
      return child;
    }
    files = child.children;
  }
}
