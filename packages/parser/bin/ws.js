const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');

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
      if (dir === 'package.json') {
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

module.exports.startWS = function () {
  const wss = new WebSocketServer({ port: 8442 });

  wss.on('connection', async function (ws, req) {
    const appName = req.url.slice(1);
    const appPath = path.resolve(process.cwd(), 'packages', appName);
    const res = await Promise.all([scanDir(process.cwd(), ['packages']), scanDir(appPath)]);
    res[0].push({
      name: 'packages',
      type: 'dir',
      path: 'packages',
      children: [{ name: appName, path: '/packages' + appName, children: res[1], type: 'dir' }]
    });
    const root = {
      name: process.cwd().split('/').pop(),
      type: 'dir',
      isroot: true,
      path: '/',
      children: res[0]
    };
    ws.send(JSON.stringify({ type: 'init', data: root }));
  });
};
