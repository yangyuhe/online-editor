/// <reference types="node" />
import * as fs from 'node:fs';
import { FsData } from '../common/types';
/**
 *
 * @param projectPath 示例"/Users/hexiang/myself/online-editor/packages/web/playground/demos/old-react-test"
 * @param pnpmPath 示例"/Users/hexiang/myself/online-editor/packages/web/playground/node_modules/.pnpm"
 * @returns
 */
export declare function listFiles(projectPath: string, pnpmPath: string, onFileData: (data: FsData) => void): fs.FSWatcher;
