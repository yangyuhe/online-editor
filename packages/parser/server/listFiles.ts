import * as path from 'node:path';
import * as fs from 'node:fs';
import { FileItem, ModulesData, FsData } from '../common/types';

/**返回从根目录包括packages下的对应app的文件结构
 * dirPath 文件夹绝对路劲
 */
async function scanDir(dirPath: string): Promise<FileItem[]> {
  const subDirs = await fs.promises.readdir(dirPath);
  const res = [];

  await waitAllTaks(subDirs, async function (subDir: string) {
    if (subDir !== 'node_modules' && !subDir.startsWith('.')) {
      const subdirPath = path.resolve(dirPath, subDir);
      const stats = await fs.promises.stat(subdirPath);
      const getFileContent = async () => {
        let content = '';
        if (stats.isFile()) {
          content = await fs.promises.readFile(subdirPath, { encoding: 'utf8' });
        }
        return content;
      };
      const getChildren = async () => {
        try {
          if (stats.isDirectory()) {
            const children = await scanDir(subdirPath);
            return children;
          }
          return [];
        } catch (err) {
          console.error(err);
          return [];
        }
      };
      const [content, children] = await Promise.all([getFileContent(), getChildren()]);

      const item: FileItem = {
        name: subDir,
        type: stats.isDirectory() ? 'dir' : 'file',
        content,
        children
      };
      res.push(item);
    }
  });

  return res;
}

function waitAllTaks(items: any[], fn) {
  const promises = [];
  items.forEach((i) => {
    promises.push(fn(i));
  });
  return Promise.all(promises);
}
async function getNodeModules(rootPath, pnpmPath: string) {
  const modulesNames = await fs.promises.readdir(rootPath);
  const result: { [realpath: string]: ModulesData } = {};

  const taskGroup = [];

  const fetchModulesData = async (rootModuleName: string) => {
    let isRoot = true;
    const rootModuleFakePath = path.resolve(rootPath, rootModuleName);
    const rootModuleRealpath = await fs.promises.realpath(rootModuleFakePath);

    if (rootModuleFakePath === rootModuleRealpath) {
      const res = await getNodeModules(rootModuleRealpath, pnpmPath);
      Object.assign(result, res);
      return;
    }

    const getChildrenNodeModules = async (curModuleRealPath: string) => {
      const packageName = curModuleRealPath.split('node_modules/').pop();

      const shortCurModuleRealPath = curModuleRealPath.slice(pnpmPath.length);
      if (result[shortCurModuleRealPath]) return;

      const getPeersData = async () => {
        const fakeDirPath = path.resolve(curModuleRealPath, '..');
        const peers = await fs.promises.readdir(fakeDirPath);
        const dependancyModule: { packageName: string; realpath: string }[] = [];
        const tasks = [];
        await waitAllTaks(peers, async function (peerName: string) {
          if (peerName !== packageName) {
            const peerFakePath = path.resolve(fakeDirPath, peerName);
            const peerRealPath = await fs.promises.realpath(peerFakePath);
            const shortPeerRealPath = peerRealPath.slice(pnpmPath.length);
            dependancyModule.push({ packageName: peerName, realpath: shortPeerRealPath });

            tasks.push(getChildrenNodeModules(peerRealPath));
          }
        });
        taskGroup.push(tasks);
        return dependancyModule;
      };

      const getModuleDirs = async () => {
        const files = await scanDir(curModuleRealPath);
        return files;
      };

      result[shortCurModuleRealPath] = {
        realpath: shortCurModuleRealPath,
        packageName,
        dependancyModules: [],
        dirs: [],
        isRoot
      };
      isRoot = false;

      const [dependancyModules, moduleDirs] = await Promise.all([getPeersData(), getModuleDirs()]);
      result[shortCurModuleRealPath].dependancyModules = dependancyModules;
      result[shortCurModuleRealPath].dirs = moduleDirs;
    };
    await getChildrenNodeModules(rootModuleRealpath);
  };

  const tasks = [];
  modulesNames.forEach((moduleName) => {
    tasks.push(fetchModulesData(moduleName));
  });
  taskGroup.push(tasks);
  while (taskGroup) {
    const tasks = taskGroup.pop();
    if (!tasks) break;
    await Promise.all(tasks);
  }
  return result;
}

/**
 *
 * @param projectPath 示例"/Users/hexiang/myself/online-editor/packages/web/playground/demos/old-react-test"
 * @param pnpmPath 示例"/Users/hexiang/myself/online-editor/packages/web/playground/node_modules/.pnpm"
 * @returns
 */
export async function listFiles(projectPath: string, pnpmPath: string): Promise<FsData> {
  console.log('pnpmPath:', pnpmPath);
  const res = await Promise.all([
    scanDir(projectPath),
    getNodeModules(path.resolve(projectPath, 'node_modules'), pnpmPath)
  ]);
  return { source: res[0], modules: res[1] };
}
