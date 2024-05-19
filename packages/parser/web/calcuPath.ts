/**
 *
 * @param {*} originRequiredModule 请求最开始的模块
 * @param {*} subRequredModule originRequiredModule的依赖模块
 * @param {*} fs
 */
export function calcuPath(originRequiredModule: string, subRequredModule: string, fs: FileData) {
  const url = new URL(originRequiredModule);
  const paths = url.pathname.split('/').filter(Boolean);
  const parents = [fs];
  let cur = fs;
  while (true) {
    if (paths.length === 0) break;
    const part = paths.shift();
    const node = cur.children.find((item) => item.name === part);
    if (node.type === 'dir') {
      parents.push(node);
      cur = node;
    } else {
      break;
    }
  }
  if (subRequredModule.startsWith('./') || subRequredModule.startsWith('../')) {
    const parts = subRequredModule.split('/');
    while (true) {
      const part = parts.shift();
      if (part === '.') continue;
      if (part === '..') {
        parents.pop();
        continue;
      }
      if (parts.length === 0) {
        const dir = parents.pop();
        const reg = new RegExp(`^${part}\\.(t|j)sx?$`);
        const file = dir.children.find((item) => reg.test(item.name) || item.name === part);
        if (file?.type === 'file') return file.path;
        const subdir = dir.children.find((item) => item.name === part);
        if (subdir.type === 'dir') {
          const file = subdir.find((item) => /^index\.(j|t)sx?$/.test(item.name));
          if (file?.type === 'file') return file.path;
        }
        return null;
      } else {
        const dir = parents[parents.length - 1];
        const child = dir.children.find((item) => item.name === part);
        if (child) parents.push(child);
        else return null;
      }
    }
  } else {
    while (true) {
      if (parents.length === 0) {
        return null;
      }
      const node = parents.pop();
      if (node.type === 'dir') {
        const nodeModulesDirNode = node.children.find((item) => item.name === 'node_modules');
        if (nodeModulesDirNode) {
          const path = findLibrary(nodeModulesDirNode, subRequredModule);
          if (path) return path;
        }
      }
    }
  }
}

function findLibrary(dirNode, library) {
  const requiredParts = library.split('/');
  let cur = dirNode;
  while (true) {
    if (requiredParts.length === 1) {
      //foo -> foo.js
      const child = cur.children.find(
        (item) =>
          (item.name === requiredParts[0] || item.name === requiredParts[0] + '.js') &&
          item.type === 'file'
      );
      if (child) return child.path;
    }
    if (requiredParts.length === 0) {
      //foo -> foo/package.json
      const packageFile = cur.children.find((item) => item.name === 'package.json');
      if (packageFile) {
        const packageJson = JSON.parse(packageFile.content);
        let main =
          packageJson.module ||
          packageJson['jsnext:main'] ||
          (typeof packageJson.browser === 'string' ? packageJson.browser : '') ||
          packageJson.main ||
          'index.js';
        if (!main.endsWith('.js')) {
          main += '.js';
        }
        const mainFilePath = findMainFile(cur, main);
        if (!mainFilePath)
          throw new Error('没找到json文件的main入口文件,package.json:' + packageFile.path);
        else return mainFilePath;
      }

      //foo -> foo/index.js
      const indexFile = cur.children.find((item) => item.name === 'index.js');
      if (indexFile) return indexFile.path;

      break;
    }
    const part = requiredParts.shift();
    const child = cur.children.find((item) => item.name === part);
    if (child) cur = child;
    else return null;
  }
  return null;
}

function findMainFile(dirNode, mainPath) {
  const pathParts = mainPath.split('/');
  let cur = dirNode;
  while (true) {
    if (pathParts.length === 0) {
      return null;
    }
    const part = pathParts.shift();
    if (part === '.') continue;
    const node = cur.children.find((item) => item.name === part);
    if (node) {
      if (pathParts.length === 0) {
        if (node.type === 'file') return node.path;
        else return null;
      } else cur = node;
    } else break;
  }
  return null;
}
