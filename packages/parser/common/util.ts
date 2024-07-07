/* eslint-disable @typescript-eslint/no-unused-vars */
import { dir } from 'console';
import { FileItem, FsData, ModulesData, PathPrefix } from './types';

export function findInMap<T>(m: { [key: string]: T }, fn: (item: T) => boolean) {
  const key = Object.keys(m).find((key) => {
    return fn(m[key]);
  });
  return m[key];
}

/**获取一个源文件的内容
 * path 例如/$$SRC/index.ts , /$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
 */
export function getFileContent(fs: FsData, path: string) {
  let files: FileItem[];
  let slices = [];
  if (path.startsWith(PathPrefix.NODE_MODULES)) {
    //key 例如 /react-dom@18.3.1_react@16.14.0/node_modules/react-dom/index.js
    //path 例如 /$$NODE_MODULES/react-dom@18.3.1_react@16.14.0/node_modules/react-dom/index.js
    const key = path.slice(PathPrefix.NODE_MODULES.length);
    const module = findInMap(fs.modules, (item) => key.startsWith(item.realpath));
    files = module.dirs;
    slices = key.slice(module.realpath.length).split('/').slice(1);
  } else {
    files = fs.source;
    slices = path.split('/').slice(2);
  }

  while (true) {
    const top = slices.shift();
    const child = files.find((file) => file.name === top);
    if (slices.length === 0) {
      return child;
    }
    files = child.children;
  }
}

function findFile(filePath: string, dirs: FileItem[]) {
  let dest: FileItem;
  const fileSlices = filePath.split('/');
  for (let i = 1; i < fileSlices.length; i++) {
    dest = dirs.find((j) => j.name === fileSlices[i]);
    if (dest?.type === 'dir') {
      dirs = dest.children;
    }
    if (!dest) {
      //import "xx/a"相当于import "xx/a.jsx?"或者import "xx/a.tsx?"
      dest = dirs.find((j) => j.name.match(new RegExp('^' + fileSlices[i] + '.(j|t)sx?$')));
      fileSlices[fileSlices.length - 1] = dest.name;
      return fileSlices.join('/');
    }
  }
  if (dest) return filePath;
  //import "xx" 相当于 import "xx/index.js"或者import "xx/index.ts"
  dest = dirs.find((j) => j.name.match(new RegExp('^index.(j|t)sx?$')));
  fileSlices.push(dest.name);
  return fileSlices.join('/');
}

//例如 requiredModule ./factoryWithTypeCheckers
//curPath /$$NODE_MODULES/prop-types@15.8.1/node_modules/prop-types/index.js
export function calculateAbsolutePath(requiredModule: string, curPath: string, fs: FsData) {
  if (requiredModule.startsWith('.')) {
    const curQ = curPath.split('/');
    curQ.pop();
    const desQ = requiredModule.split('/');
    while (desQ.length > 0) {
      const top = desQ.shift();
      if (top === '.') continue;
      if (top === '..') {
        curQ.pop();
        continue;
      }
      curQ.push(top);
    }
    //requiredFile 例如/$$NODE_MODULES/react@16.14.0/node_modules/react/cjs/react.development.js
    const requiredFile = curQ.join('/');
    if (requiredFile.match(/\.\w+$/)) return requiredFile;
    let dirs: FileItem[];
    let filePath: string;
    let prefix: string;
    if (requiredFile.startsWith(PathPrefix.NODE_MODULES)) {
      const fullPath = '/' + curQ.slice(2).join('/');
      const module = findInMap(fs.modules, (i) => fullPath.startsWith(i.realpath));
      dirs = module.dirs;
      filePath = fullPath.slice(module.realpath.length);
      prefix = PathPrefix.NODE_MODULES + module.realpath;
    } else {
      dirs = fs.source;
      filePath = requiredFile.slice(PathPrefix.SRC.length);
      prefix = PathPrefix.SRC;
    }

    const fileRealPath = findFile(filePath, dirs);
    return prefix + fileRealPath;
  } else {
    const isInPackage = (requiredModule: string, packageName: string) => {
      return packageName === requiredModule || requiredModule.startsWith(packageName + '/');
    };
    //认为是第三方库
    let targetModule: ModulesData;
    if (curPath.startsWith(PathPrefix.SRC))
      targetModule = findInMap(
        fs.modules,
        (item) => isInPackage(requiredModule, item.packageName) && item.isRoot
      );
    else {
      //例如 requiredMoudule object-assign,
      //curPath /$$NODE_MODULES/react@16.14.0/node_modules/react/cjs/react.development.js
      const _curPath = '/' + curPath.split('/').slice(2).join('/');
      const module = findInMap(fs.modules, (i) => _curPath.startsWith(i.realpath));
      const dependancyModule =
        module.dependancyModules.find((i) => isInPackage(requiredModule, i.packageName)) ||
        (isInPackage(requiredModule, module.packageName) && module);
      targetModule = fs.modules[dependancyModule.realpath];
    }
    if (requiredModule === targetModule.packageName) {
      const packageContent = targetModule.dirs.find((i) => i.name === 'package.json').content;
      const packageObj = JSON.parse(packageContent);
      let main =
        packageObj.module ||
        packageObj['jsnext:main'] ||
        (typeof packageObj.browser === 'string' ? packageObj.browser : '') ||
        packageObj.main ||
        'index.js';
      main = main.startsWith('/') ? main : '/' + main;
      const realpath = findFile(main, targetModule.dirs);
      return PathPrefix.NODE_MODULES + targetModule.realpath + realpath;
    } else {
      const moduleFile = requiredModule.slice(targetModule.packageName.length);
      const fileRealPath = findFile(moduleFile, targetModule.dirs);
      return PathPrefix.NODE_MODULES + targetModule.realpath + fileRealPath;
    }
  }
}
