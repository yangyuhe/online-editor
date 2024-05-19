import React, { useCallback, useState } from 'react';
import Icon from '../../components/icon';
import { FileData } from '../../utils/types';
import { useProjectContext } from './context';
import cn from 'classnames';
import { changeFilePath } from '../../utils/path';

/**文件夹 */
function _DirectoryItem(props: {
  item: FileData;
  onSelect: (file: FileData) => void;
  reNameFile: (item: FileData, newName: string) => void;
}) {
  const { item, onSelect, reNameFile } = props;
  const [open, setOpen] = useState(false);
  const { curFile, renameFile } = useProjectContext();
  const [renameVal, setRenameVal] = useState(item.name);

  return (
    <li>
      <details open={open}>
        <summary
          className={cn({ '!bg-neutral !text-neutral-content': curFile?.path === item.path })}
          onClick={(evt) => {
            evt.preventDefault();
            onSelect(item);
            setOpen((open) => !open);
          }}
        >
          <Icon name={open ? 'minus-square' : 'plus-square'} />
          {renameFile === item.path ? (
            <input
              value={renameVal}
              onChange={(evt) => {
                setRenameVal(evt.target.value);
              }}
              autoFocus
              onKeyDown={(evt) => {
                if (evt.code === 'Enter') {
                  reNameFile(item, renameVal);
                }
              }}
              onBlur={() => reNameFile(item, renameVal)}
            />
          ) : (
            <span>{item.name}</span>
          )}
        </summary>
        {open ? (
          <ul>
            {item.children.map((i) => {
              if (i.type === 'dir')
                return (
                  <DirectoryItem
                    reNameFile={reNameFile}
                    onSelect={onSelect}
                    key={'dir-' + i.name}
                    item={i}
                  />
                );
              return (
                <FileItem
                  reNameFile={reNameFile}
                  key={'file-' + i.name}
                  onSelect={onSelect}
                  item={i}
                />
              );
            })}
          </ul>
        ) : null}
      </details>
    </li>
  );
}
const DirectoryItem = React.memo(_DirectoryItem);

/**文件 */
function _FileItem(props: {
  item: FileData;
  onSelect: (file: FileData) => void;
  reNameFile: (item: FileData, newName: string) => void;
}) {
  const { item, onSelect, reNameFile } = props;
  const { curFile, renameFile } = useProjectContext();
  const [renameVal, setRenameVal] = useState(item.name);
  return (
    <li
      onClick={() => {
        onSelect(item);
      }}
    >
      {renameFile === item.path ? (
        <input
          autoFocus
          value={renameVal}
          onChange={(evt) => setRenameVal(evt.target.value)}
          onKeyDown={(evt) => {
            if (evt.code === 'Enter') {
              reNameFile(item, renameVal);
            }
          }}
          onBlur={() => reNameFile(item, renameVal)}
        />
      ) : (
        <button className={cn({ active: curFile?.path === item.path })}>{item.name}</button>
      )}
    </li>
  );
}
const FileItem = React.memo(_FileItem);

/**递归显示文件夹和文件 */
export default function DirectoryTree() {
  const { dir, setCurFile, setRenameFile, reRenderDir } = useProjectContext();
  const reNameFile = useCallback(
    (item: FileData, newName: string) => {
      const oldPath = item.path;
      item.name = newName;
      item.path = changeFilePath(item.path, newName);
      setRenameFile('');
      reRenderDir();
      import('monaco-editor').then((monaco) => {
        const oldUri = new monaco.Uri().with({ path: oldPath });
        const oldModel = monaco.editor.getModel(oldUri);
        if (oldModel) {
          const oldValue = oldModel.getValue();
          const newUri = new monaco.Uri().with({ path: item.path });
          oldModel.dispose();
          monaco.editor.createModel(oldValue, null, newUri);
          setCurFile({ ...item });
        }
      });
    },
    [reRenderDir, setCurFile, setRenameFile]
  );

  return dir ? (
    <ul className='menu menu-xs bg-base-200 rounded-lg overflow-auto'>
      {dir.children.map((child) => {
        if (child.type === 'dir')
          return (
            <DirectoryItem
              reNameFile={reNameFile}
              key={'dir-' + child.name}
              onSelect={(file) => {
                setCurFile(file);
              }}
              item={child}
            />
          );
        else
          return (
            <FileItem
              reNameFile={reNameFile}
              key={'file-' + child.name}
              onSelect={(file) => {
                setCurFile(file);
              }}
              item={child}
            />
          );
      })}
    </ul>
  ) : null;
}
