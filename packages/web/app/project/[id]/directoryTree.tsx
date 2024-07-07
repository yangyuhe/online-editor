import React, { useCallback, useState } from 'react';
import Icon from '../../components/icon';
import { useProjectContext } from './context';
import cn from 'classnames';
import { getFileFullPath } from '../../utils/path';
import { FileItem } from '@online-editor/parser/common/types';

/**文件夹 */
function _DirectoryItem(props: {
  item: FileItem;
  onSelect: (file: FileItem) => void;
  reNameFile: (item: FileItem, newName: string) => void;
}) {
  const { item, onSelect, reNameFile } = props;
  const [open, setOpen] = useState(false);
  const { curFile, renameFile } = useProjectContext();
  const [renameVal, setRenameVal] = useState(item.name);

  return (
    <li>
      <details open={open}>
        <summary
          className={cn({ '!bg-neutral !text-neutral-content': curFile === item })}
          onClick={(evt) => {
            evt.preventDefault();
            onSelect(item);
            setOpen((open) => !open);
          }}
        >
          <Icon name={open ? 'minus-square' : 'plus-square'} />
          {renameFile === item ? (
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
                  <MemoDirectoryItem
                    reNameFile={reNameFile}
                    onSelect={onSelect}
                    key={'dir-' + i.name}
                    item={i}
                  />
                );
              return (
                <MemoFileItem
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
const MemoDirectoryItem = React.memo(_DirectoryItem);

/**文件 */
function _FileItem(props: {
  item: FileItem;
  onSelect: (file: FileItem) => void;
  reNameFile: (item: FileItem, newName: string) => void;
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
      {renameFile === item ? (
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
        <button className={cn({ active: curFile === item })}>{item.name}</button>
      )}
    </li>
  );
}
const MemoFileItem = React.memo(_FileItem);

/**递归显示文件夹和文件 */
export default function DirectoryTree() {
  const { exFsData, setCurFile, setRenameFile, refreshDirTree } = useProjectContext();
  const reNameFile = useCallback(
    (item: FileItem, newName: string) => {
      const oldPath = getFileFullPath(item);
      item.name = newName;
      setRenameFile(null);
      refreshDirTree();
      import('monaco-editor').then((monaco) => {
        const oldUri = new monaco.Uri().with({ path: oldPath });
        const oldModel = monaco.editor.getModel(oldUri);
        if (oldModel) {
          const oldValue = oldModel.getValue();
          const newUri = new monaco.Uri().with({ path: getFileFullPath(item) });
          oldModel.dispose();
          monaco.editor.createModel(oldValue, null, newUri);
          setCurFile({ ...item });
        }
      });
    },
    [refreshDirTree, setCurFile, setRenameFile]
  );

  return exFsData ? (
    <ul className='menu menu-xs bg-base-200 rounded-lg overflow-auto'>
      <MemoDirectoryItem
        reNameFile={reNameFile}
        key={'dir-' + 'node_modules'}
        onSelect={(file) => {
          setCurFile(file);
        }}
        item={exFsData.nodeModules}
      />
      {exFsData.source.map((child) => {
        if (child.type === 'dir')
          return (
            <MemoDirectoryItem
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
            <MemoFileItem
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
