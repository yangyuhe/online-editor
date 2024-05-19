export type FileData = {
  name: string;
  type: 'dir' | 'file';
  path: string;
  isroot?: boolean;
  children?: FileData[];
  content?: string;
  parent?: FileData;
};
