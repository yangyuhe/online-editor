import { FileItem } from '@online-editor/parser/common/types';

export function getFileFullPath(item: FileItem) {
  if (item.parent) return getFileFullPath(item.parent) + '/' + item.name;
  return item.name;
}

export function newFileName(dir: FileItem) {
  const name = 'Untitled';
  let count = 1;
  while (true) {
    if (dir.children.some((i) => i.name === name + (count === 1 ? '' : '-' + count))) {
      count++;
    } else break;
  }
  return name + (count === 1 ? '' : '-' + count);
}
