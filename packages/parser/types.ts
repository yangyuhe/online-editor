export type ListFileData = {
  src: FileItem[];
  nodeModules: NodeModulesData;
};
export type NodeModulesData = {
  nodeModules: LibraryData[];
  absolutePathMap: { [path: string]: FileItem[] };
};

export type LibraryData = {
  realpath: string;
  dependancyLibrary: LibraryData[];
};
export type FileItem = {
  type: 'dir' | 'file';
  name: string;
  content: string;
  children: FileItem[];
};
