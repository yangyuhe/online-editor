/* eslint-disable @typescript-eslint/no-unused-vars */
import { PathPrefix } from './types';
export function findInMap(m, fn) {
    const val = Object.values(m).find((val) => {
        return fn(val);
    });
    return val;
}
/**获取一个源文件的内容
 * path 例如/$$SRC/index.ts , /$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
 */
export function getFileData(fs, path) {
    let files;
    let slices = [];
    if (path.startsWith(PathPrefix.NODE_MODULES)) {
        //key 例如 /react-dom@18.3.1_react@16.14.0/node_modules/react-dom/index.js
        //path 例如 /$$NODE_MODULES/react-dom@18.3.1_react@16.14.0/node_modules/react-dom/index.js
        const key = path.slice(PathPrefix.NODE_MODULES.length);
        const module = findInMap(fs.modules, (item) => key.startsWith(item.realpath));
        if (!module)
            return null;
        files = module.dirs;
        slices = key.slice(module.realpath.length).split('/').slice(1);
    }
    else {
        files = fs.source;
        slices = path.split('/').slice(2);
    }
    while (true) {
        const top = slices.shift();
        const child = files.find((file) => file.name === top);
        if (!child)
            return null;
        if (slices.length === 0) {
            return child;
        }
        files = child.children;
    }
}
/**
 * 从dirs列表以及子文件夹中查找路径为filePath的文件
 * @param filePath 不含/开头的路径
 * @param dirs
 * @returns 返回值pathname不包含/开头
 */
function findFile(filePath, dirs) {
    const fileSlices = filePath.split('/');
    for (let i = 0; i < fileSlices.length; i++) {
        const dir = dirs.find((j) => j.name === fileSlices[i] && j.type === 'dir');
        if (dir) {
            if (i === fileSlices.length - 1) {
                //import "xx" 相当于 import "xx/index.js"或者import "xx/index.ts"
                const file = dir.children.find((j) => j.name.match(new RegExp('^index.(j|t)sx?$')));
                fileSlices.push(file.name);
                return { pathname: fileSlices.join('/'), content: file.content };
            }
            else {
                dirs = dir.children;
                continue;
            }
        }
        let file = dirs.find((j) => j.name === fileSlices[i] && j.type === 'file');
        if (file) {
            if (i === fileSlices.length - 1)
                return { pathname: fileSlices.join('/'), content: file.content };
            else
                throw new Error('找不到匹配的文件路径:' + filePath);
        }
        else {
            //import "xx/a"相当于import "xx/a.jsx?"或者import "xx/a.tsx?"
            file = dirs.find((j) => j.name.match(new RegExp('^' + fileSlices[i] + '.(j|t)sx?$')));
            if (file) {
                fileSlices[fileSlices.length - 1] = file.name;
                return { pathname: fileSlices.join('/'), content: file.content };
            }
            else
                throw new Error('找不到匹配的文件路径:' + filePath);
        }
    }
    throw new Error('找不到匹配的文件路径:' + filePath);
}
/**
 * 根据相对路径计算绝对路径
 * @param relativePath 相对路径
 * @param basePath 当前路径
 * @returns
 */
function flatPath(relativePath, basePath) {
    const url = new URL(relativePath, 'file://' + basePath);
    return url.pathname;
}
/**
 * 负责计算被require的文件的绝对路径
 * @param requiredModule 例如 ./factoryWithTypeCheckers
 * @param curPath 例如/$$NODE_MODULES/prop-types@15.8.1/node_modules/prop-types/index.js
 * @param fs 文件系统
 * @returns
 */
export function calculateAbsolutePath(requiredModule, curPath, fs) {
    const file = getRequiredFile(requiredModule, curPath, fs);
    return file.pathname;
}
export function getRequiredFile(requiredModule, curPath, fs) {
    let requiredFile = requiredModule;
    if (requiredModule.startsWith('./') || requiredModule.startsWith('../'))
        //说明请求的是当前包中的文件或者是非包文件（即src文件）
        //requiredFile 例如/$$NODE_MODULES/react@16.14.0/node_modules/react/cjs/react.development.js
        requiredFile = flatPath(requiredModule, curPath);
    if (requiredFile.startsWith(PathPrefix.NODE_MODULES) || requiredFile.startsWith(PathPrefix.SRC)) {
        let dirs;
        let filePath;
        let prefix;
        //是否是包文件
        if (requiredFile.startsWith(PathPrefix.NODE_MODULES)) {
            //从node_modules文件系统查询当前包的文件夹目录
            const fullPath = '/' + requiredFile.split('/').slice(2).join('/');
            const module = findInMap(fs.modules, (i) => fullPath.startsWith(i.realpath));
            dirs = module.dirs;
            filePath = fullPath.slice(module.realpath.length);
            prefix = PathPrefix.NODE_MODULES + module.realpath;
        }
        else {
            //使用src的文件夹目录
            dirs = fs.source;
            filePath = requiredFile.slice(PathPrefix.SRC.length);
            prefix = PathPrefix.SRC;
        }
        if (filePath.startsWith('/'))
            filePath = filePath.slice(1);
        //根据上一步的结论查找最终文件绝对路径
        const realFile = findFile(filePath, dirs);
        return { pathname: prefix + '/' + realFile.pathname, content: realFile.content };
    }
    else {
        //说明请求的是一个第三方包的文件
        const belongToPackage = (requiredModule, packageName) => {
            return packageName === requiredModule || requiredModule.startsWith(packageName + '/');
        };
        let targetModule;
        //判断请求者是否是src中的文件
        if (curPath.startsWith(PathPrefix.SRC))
            //则获取到node_modules文件系统中包名相同且被项目直接依赖的包
            targetModule = findInMap(fs.modules, (item) => belongToPackage(requiredModule, item.packageName) && item.isRoot);
        else {
            //则获取当前请求者所在的包，从这个包的依赖包中获取请求的包
            //例如 requiredMoudule object-assign,
            //curPath /$$NODE_MODULES/react@16.14.0/node_modules/react/cjs/react.development.js
            const _curPath = '/' + curPath.split('/').slice(2).join('/');
            const module = findInMap(fs.modules, (i) => _curPath.startsWith(i.realpath));
            const dependancyModule = module.dependancyModules.find((i) => belongToPackage(requiredModule, i.packageName)) ||
                (belongToPackage(requiredModule, module.packageName) && module);
            targetModule = fs.modules[dependancyModule.realpath];
        }
        //根据上一步中得到的包，再具体计算请求的文件的绝对路径
        if (requiredModule === targetModule.packageName) {
            const packageContent = targetModule.dirs.find((i) => i.name === 'package.json').content;
            const packageObj = JSON.parse(packageContent);
            let main = packageObj.module ||
                packageObj['jsnext:main'] ||
                (typeof packageObj.browser === 'string' ? packageObj.browser : '') ||
                packageObj.main ||
                'index.js';
            main = main.startsWith('./') ? main.slice(2) : main.startsWith('/') ? main.slice(1) : main;
            const realFile = findFile(main, targetModule.dirs);
            return {
                pathname: PathPrefix.NODE_MODULES + targetModule.realpath + '/' + realFile.pathname,
                content: realFile.content
            };
        }
        else {
            const moduleFile = requiredModule.slice(targetModule.packageName.length + 1);
            const realFile = findFile(moduleFile, targetModule.dirs);
            return {
                pathname: PathPrefix.NODE_MODULES + targetModule.realpath + '/' + realFile.pathname,
                content: realFile.content
            };
        }
    }
}
/**去除文件信息，只保留路径信息 */
export function extractFromFsData(fs) {
    const tinyFs = {
        source: [],
        modules: {}
    };
    const recursive = (item) => {
        const tinyItem = { ...item, content: '', children: [] };
        item.children.forEach((i) => {
            tinyItem.children.push(recursive(i));
        });
        return tinyItem;
    };
    tinyFs.source = fs.source.map((item) => recursive(item));
    for (const key in fs.modules) {
        tinyFs.modules[key] = {
            ...fs.modules[key],
            dirs: fs.modules[key].dirs.map((i) => recursive(i))
        };
    }
    return tinyFs;
}
