import { FileData } from './types';

export function changeFilePath(path: string, newName: string) {
  const paths = path.split('/');
  paths.pop();
  return paths.concat(newName).join('/');
}

export function newFileName(dir: FileData) {
  const name = 'Untitled';
  let count = 1;
  while (true) {
    if (dir.children.some((i) => i.name === name + (count === 1 ? '' : '-' + count))) {
      count++;
    } else break;
  }
  return name + (count === 1 ? '' : '-' + count);
}
