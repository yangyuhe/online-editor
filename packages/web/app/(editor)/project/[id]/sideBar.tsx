import Icon from '@/components/icon';
import React from 'react';
import { useProjectContext } from './context';

export default function Sidebar() {
  const { setCurFile } = useProjectContext();
  return (
    <ul
      className='menu bg-neutral text-neutral-content flex-none'
      onClick={() => {
        setCurFile(null);
      }}
    >
      <li>
        <a>
          <Icon name='file-text' className='text-[20px]' />
        </a>
      </li>
      <li>
        <a>
          <Icon name='setting' className='text-[20px]' />
        </a>
      </li>
    </ul>
  );
}
