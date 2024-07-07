import { FileItem, FsData } from '@online-editor/parser/common/types';
import React, { useContext, useEffect, useState } from 'react';

type ProjectContextType = {
  /**目录结构 */
  exFsData: ExtFsData;
  /**当前打开的文件 */
  curFile: FileItem;
  /**设置当前打开的文件 */
  setCurFile: (file: FileItem) => void;
  /**重命名的文件（路径） */
  renameFile: FileItem;
  /**设置当前重命名的文件的 */
  setRenameFile: (file: FileItem) => void;
  /**刷新文件树 */
  refreshDirTree: () => void;
};
const ProjectContext = React.createContext<ProjectContextType>({
  exFsData: null,
  curFile: null,
  setCurFile: () => {},
  renameFile: null,
  setRenameFile: () => {},
  refreshDirTree: () => {}
});

type ProjectContextProviderProps = {
  children: React.ReactNode;
  projectId: string;
};

export const useProjectContext = () => useContext(ProjectContext);

export function ProjectContextProvider({ children, projectId }: ProjectContextProviderProps) {
  const [exFsData, refreshDirTree] = useDirs(projectId);
  const [curFile, setCurFile] = useState<FileItem>(null);
  const [renameFile, setRenameFile] = useState<FileItem>(null);

  return (
    <ProjectContext.Provider
      value={{
        exFsData,
        curFile,
        setCurFile,
        renameFile,
        setRenameFile,
        refreshDirTree
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

type ExtFsData = { nodeModules: FileItem } & FsData;

function useDirs(projectId): [ExtFsData, () => void] {
  const [dir, setDir] = useState<ExtFsData>(null);
  useEffect(() => {
    const eventSource = new EventSource('/api/sse?project=' + projectId, {
      withCredentials: true
    });
    console.info('Listenting on SEE', eventSource);
    eventSource.onmessage = (event) => {
      const fsData: FsData = JSON.parse(event.data);
      console.log(fsData);
      const linkParent = (dir: FileItem) => {
        dir.children.forEach((child) => {
          child.parent = dir;
          if (child.type === 'dir') linkParent(child);
        });
      };
      fsData.source.forEach((i) => i.type === 'dir' && linkParent(i));

      const extFsData: ExtFsData = {
        ...fsData,
        nodeModules: { name: 'node_modules', type: 'dir', children: [], content: '' }
      };
      const modules: FileItem[] = [];
      Object.entries(fsData.modules).forEach((entry) => {
        modules.push({
          // name: entry[0].split('/')[1].replace('+', '/'),
          name: entry[1].packageName,
          content: '',
          children: entry[1].dirs,
          type: 'dir'
        });
      });
      extFsData.nodeModules.children = modules;
      linkParent(extFsData.nodeModules);

      setDir(extFsData);
    };
    return () => {
      eventSource.close();
    };
  }, [projectId]);
  return [dir, () => setDir({ ...dir })];
}
