import { FileItem, FsData } from './types';
export declare function findInMap<T>(m: {
    [key: string]: T;
}, fn: (item: T) => boolean): T;
/**获取一个源文件的内容
 * path 例如/$$SRC/index.ts , /$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
 */
export declare function getFileData(fs: FsData, path: string): FileItem;
/**
 * 负责计算被require的文件的绝对路径
 * @param requiredModule 例如 ./factoryWithTypeCheckers
 * @param curPath 例如/$$NODE_MODULES/prop-types@15.8.1/node_modules/prop-types/index.js
 * @param fs 文件系统
 * @returns
 */
export declare function calculateAbsolutePath(requiredModule: string, curPath: string, fs: FsData): string;
export declare function getRequiredFile(requiredModule: string, curPath: string, fs: FsData): {
    pathname: string;
    content: string;
};
/**去除文件信息，只保留路径信息 */
export declare function extractFromFsData(fs: FsData): FsData;
