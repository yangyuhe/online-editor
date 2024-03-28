export type FileItem = {
  name: string;
  type: 'dir' | 'file';
  path: string;
  isroot?: boolean;
  children?: FileItem[];
};
