import React, { useContext, useEffect, useState } from 'react';
import { FileData } from '../../utils/types';

type ProjectContextType = {
  /**目录结构 */
  dir: FileData;
  /**设置目录结构 */
  setDir: (FileData) => void;
  /**更新目录 */
  reRenderDir: () => void;
  /**当前打开的文件 */
  curFile: FileData;
  /**设置当前打开的文件 */
  setCurFile: (file: FileData) => void;
  /**重命名的文件（路径） */
  renameFile: string;
  /**设置当前重命名的文件的 */
  setRenameFile: (path: string) => void;
};
const ProjectContext = React.createContext<ProjectContextType>({
  dir: null,
  setDir: () => {},
  reRenderDir: () => {},
  curFile: null,
  setCurFile: () => {},
  renameFile: '',
  setRenameFile: () => {}
});

type ProjectContextProviderProps = {
  children: React.ReactNode;
  projectId: string;
};

export const useProjectContext = () => useContext(ProjectContext);

export function ProjectContextProvider({ children, projectId }: ProjectContextProviderProps) {
  const [dir, setDir, reRenderDir] = useDirs(projectId);
  const [curFile, setCurFile] = useState<FileData>(null);
  const [renameFile, setRenameFile] = useState('');

  return (
    <ProjectContext.Provider
      value={{
        dir,
        setDir,
        curFile,
        setCurFile,
        renameFile,
        setRenameFile,
        reRenderDir
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

function useDirs(projectId): [FileData, (FileData) => void, () => void] {
  const [dir, setDir] = useState<FileData>(null);
  useEffect(() => {
    const eventSource = new EventSource('/api/sse?project=' + projectId, {
      withCredentials: true
    });
    console.info('Listenting on SEE', eventSource);
    eventSource.onmessage = (event) => {
      const rootDir: FileData = JSON.parse(event.data);
      const setParent = (dir: FileData) => {
        dir.children.forEach((child) => {
          child.parent = dir;
          if (child.type === 'dir') setParent(child);
        });
      };
      setParent(rootDir);
      setDir(rootDir);
    };
    return () => {
      eventSource.close();
    };
  }, [projectId]);
  return [dir, setDir, () => setDir({ ...dir })];
}
