import React, { useMemo } from 'react';
import { useProjectContext } from './context';
import Icon, { IconName } from '../../components/icon';
import { FileData } from '../../utils/types';
import { newFileName } from '../../utils/path';

export default function Tools() {
  const { reRenderDir, setCurFile, curFile, setRenameFile } = useProjectContext();

  const menus = useMemo(() => {
    const m: {
      icon: IconName;
      key?: string;
      tip: string;
      divider?: boolean;
      onClick?: () => void;
    }[] = [];

    m.push({ icon: 'save', tip: '保存全部' });
    m.push({ icon: 'eye', tip: '预览', divider: true });

    if (!curFile) {
    } else {
      const addNewFile = (type: 'file' | 'dir') => {
        const parent = curFile.type === 'file' ? curFile.parent : curFile;
        const newName = newFileName(parent);
        const newFile: FileData = {
          name: newName,
          type,
          path: parent.path + '/' + newName,
          content: '',
          parent,
          children: []
        };
        parent.children.push(newFile);

        setCurFile(newFile);
        setRenameFile(newFile.path);
        reRenderDir();
      };
      m.push({
        icon: 'file-add',
        tip: '添加文件',
        onClick() {
          addNewFile('file');
        }
      });
      m.push({
        icon: 'folder-add',
        tip: '添加文件夹',
        onClick() {
          addNewFile('dir');
        }
      });
      m.push({
        icon: 'edit-square',
        tip: '重命名',
        onClick() {
          setRenameFile(curFile.path);
        }
      });
      m.push({ icon: 'delete', tip: '删除' });

      if (curFile.type === 'file') {
        m.push({ icon: 'save', key: 'save-single', tip: '保存' });
      }
      if (curFile.path === 'package.json') {
        m.push({ icon: 'sync', tip: '更新依赖包' });
      }
      return m;
    }

    return m;
  }, [curFile, reRenderDir, setCurFile, setRenameFile]);

  return (
    <ul className='menu bg-neutral text-neutral-content menu-horizontal'>
      <li>
        <a title='this is logo' className='font-bold'>
          OE
        </a>
      </li>
      {menus.map((i, index) => {
        return (
          <React.Fragment key={i.key || i.icon}>
            <li className='mr-[5px] hover:text-base-100'>
              <button className='focus:text-base-100' onClick={() => i.onClick?.()}>
                <Icon name={i.icon} className='text-[20px]' />
                {i.tip}
              </button>
            </li>
            {i.divider && index !== menus.length - 1 ? (
              <div className='h-[60%] w-[1px] bg-white self-center'></div>
            ) : null}
          </React.Fragment>
        );
      })}
    </ul>
  );
}
