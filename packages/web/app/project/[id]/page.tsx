'use client';

import Content from './content';
import { ProjectContextProvider } from './context';
import Directory from './directoryTree';
import Sidebar from './sideBar';
import Tools from './tools';

export default function Project(props: { params: { id: string } }) {
  const {
    params: { id }
  } = props;

  return (
    <ProjectContextProvider projectId={id}>
      <div className='flex h-full flex-col'>
        <Tools />
        <div className='flex flex-auto overflow-hidden'>
          <Sidebar />
          <div className='w-[200px] bg-base-300 overflow-auto'>
            <Directory />
          </div>
          <div className='flex-auto bg-base-100'>
            <Content />
          </div>
        </div>
      </div>
    </ProjectContextProvider>
  );
}
