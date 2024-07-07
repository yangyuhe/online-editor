import { FileItem, FsData } from './types';
export declare function findInMap<T>(m: {
    [key: string]: T;
}, fn: (item: T) => boolean): T;
/**获取一个源文件的内容
 * path 例如/$$SRC/index.ts , /$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
 */
export declare function getFileContent(fs: FsData, path: string): FileItem;
export declare function calculateAbsolutePath(requiredModule: string, curPath: string, fs: FsData): string;
