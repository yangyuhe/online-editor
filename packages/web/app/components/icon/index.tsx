import cn from 'classnames';

export type IconName =
  | 'minus-square'
  | 'plus-square'
  | 'setting'
  | 'file-text'
  | 'eye'
  | 'edit-square'
  | 'save'
  | 'file-add'
  | 'Batchfolding'
  | 'delete'
  | 'folder'
  | 'folder-open'
  | 'folder-add'
  | 'sync';
export default function Icon(props: { name: IconName; className?: string }) {
  const { name, className } = props;
  return (
    <svg className={cn('icon', className)} aria-hidden='true'>
      <use xlinkHref={'#online-editor-' + name}></use>
    </svg>
  );
}
