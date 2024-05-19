import path from 'path';
import fs from 'fs';

/**返回从根目录包括packages下的对应app的文件结构
 * dirPath 文件夹绝对路劲
 * excludes 排除的子文件夹名称
 */
export async function scanDir(dirPath: string, rootPath: string, excludes: string[] = []) {
  const dirs = await fs.promises.readdir(dirPath);
  const promises = [];
  const res = [];
  const scan = async (dir) => {
    if (!excludes.includes(dir) && !dir.startsWith('.')) {
      const subdirPath = path.resolve(dirPath, dir);
      const stats = await fs.promises.stat(subdirPath);
      let content = '';
      if (stats.isFile()) {
        content = await fs.promises.readFile(subdirPath, { encoding: 'utf8' });
      }
      const item = {
        name: dir,
        path: '/' + path.relative(rootPath, subdirPath),
        type: stats.isDirectory() ? 'dir' : 'file',
        content,
        children: []
      };
      res.push(item);
      try {
        if (stats.isDirectory()) {
          const children = await scanDir(subdirPath, rootPath, excludes);
          item.children = children;
        }
      } catch (err) {
        console.error(err);
      }
    }
  };
  dirs.forEach((dir) => promises.push(scan(dir)));
  await Promise.all(promises);
  return res;
}

export async function startWatch(projectPath: string, excludes: string[] = []) {
  const res = await scanDir(projectPath, projectPath, excludes);

  const root = {
    name: 'root',
    type: 'dir',
    isroot: true,
    path: '',
    children: res
  };
  return root;
}
