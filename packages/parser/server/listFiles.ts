import * as path from 'path';
import * as fs from 'fs';
import { FileItem, NodeModulesData, LibraryData, ListFileData } from '../types';

/**返回从根目录包括packages下的对应app的文件结构
 * dirPath 文件夹绝对路劲
 * excludes 排除的子文件夹名称
 */
async function scanDir(dirPath: string): Promise<FileItem[]> {
  const subDirs = await fs.promises.readdir(dirPath);
  const res = [];

  await waitAllTaks(subDirs, async function (subDir: string) {
    if (subDir !== 'node_modules' && !subDir.startsWith('.')) {
      const subdirPath = path.resolve(dirPath, subDir);
      const stats = await fs.promises.stat(subdirPath);
      let content = '';
      if (stats.isFile()) {
        content = await fs.promises.readFile(subdirPath, { encoding: 'utf8' });
      }
      const item: FileItem = {
        name: subDir,
        type: stats.isDirectory() ? 'dir' : 'file',
        content,
        children: []
      };
      res.push(item);
      try {
        if (stats.isDirectory()) {
          const children = await scanDir(subdirPath);
          item.children = children;
        }
      } catch (err) {
        console.error(err);
      }
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
async function getNodeModules(nodeModulesRootPath, prefix: string) {
  const librariesNames = await fs.promises.readdir(nodeModulesRootPath);
  const result: NodeModulesData = {
    nodeModules: [],
    absolutePathMap: {}
  };

  await waitAllTaks(librariesNames, async (libraryName: string) => {
    const libraryFakePath = path.resolve(nodeModulesRootPath, libraryName);
    const libraryRealpath = await fs.promises.realpath(libraryFakePath);
    const getChildrenNodeModules = async (curLibraryRealPath: string): Promise<LibraryData> => {
      const libraryName = curLibraryRealPath.split('/').pop();
      const fakeDirPath = path.resolve(curLibraryRealPath, '..');
      const peers = await fs.promises.readdir(fakeDirPath);
      const dependancyLibrary = [];
      await waitAllTaks(peers, async function (peerName: string) {
        if (peerName !== libraryName) {
          const peerFakePath = path.resolve(fakeDirPath, peerName);
          const peerRealPath = await fs.promises.realpath(peerFakePath);
          const library = await getChildrenNodeModules(peerRealPath);
          dependancyLibrary.push(library);
        }
      });
      const files = await scanDir(curLibraryRealPath);
      const shortRealPath = curLibraryRealPath.slice(prefix.length);
      result.absolutePathMap[shortRealPath] = files;
      return {
        realpath: shortRealPath,
        dependancyLibrary
      };
    };
    const libraryItem = await getChildrenNodeModules(libraryRealpath);
    result.nodeModules.push(libraryItem);
  });
  return result;
}

export async function listFiles(projectPath: string, pnpmPath: string): Promise<ListFileData> {
  const res = await Promise.all([
    scanDir(projectPath),
    getNodeModules(path.resolve(projectPath, 'node_modules'), pnpmPath)
  ]);
  return { src: res[0], nodeModules: res[1] };
}
