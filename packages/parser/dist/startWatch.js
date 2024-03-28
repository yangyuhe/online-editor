'use strict';

var path = require('path');
var fs = require('fs');

/**返回从根目录包括packages下的对应app的文件结构
 * dirPath 文件夹绝对路劲
 * excludes 排除的子文件夹名称
 */
async function scanDir(dirPath, excludes = []) {
  const dirs = await fs.promises.readdir(dirPath);
  let promises = [];
  let res = [];
  const root = process.cwd();
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
        path: '/' + path.relative(root, subdirPath),
        type: stats.isDirectory() ? 'dir' : 'file',
        content
      };
      res.push(item);
      try {
        if (stats.isDirectory()) {
          const children = await scanDir(subdirPath);
          item.children = children;
        }
      } catch (err) {}
    }
  };
  dirs.forEach((dir) => promises.push(scan(dir)));
  await Promise.all(promises);
  return res;
}

async function startWatch(projectPath, excludes = []) {
  const res = await scanDir(projectPath, excludes);

  const root = {
    name: 'root',
    type: 'dir',
    isroot: true,
    path: '/',
    children: res
  };
  return root;
}

exports.startWatch = startWatch;
