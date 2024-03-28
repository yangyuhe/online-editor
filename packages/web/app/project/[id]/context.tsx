import React, { useContext, useEffect, useState } from 'react';
import { FileItem } from '../../utils/types';

const ProjectContext = React.createContext<{ dir: FileItem }>({
  dir: null
});

type ProjectContextProviderProps = {
  children: React.ReactNode;
  projectId: string
};

export const useProjectContext = () => useContext(ProjectContext);

export function ProjectContextProvider({ children, projectId }: ProjectContextProviderProps) {

  const [dir, setDir] = useState<FileItem>(null)
  useEffect(() => {
    const eventSource = new EventSource("/api/sse?project=" + projectId, {
      withCredentials: true,
    });
    console.info("Listenting on SEE", eventSource);
    eventSource.onmessage = (event) => {
      console.log(JSON.parse(event.data));
      setDir(JSON.parse(event.data))
    };
    return () => {
      eventSource.close()
    }
  }, [projectId])
  return <ProjectContext.Provider value={{ dir }}>{children}</ProjectContext.Provider>;
}
