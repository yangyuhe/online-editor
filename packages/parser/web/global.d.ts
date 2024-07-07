declare let Babel: any;

declare interface Window {
  /**包之间的依赖关系,用于调试某个包为什么被加载 */
  _tree: any[];
  /**模拟webpack中可能用到process变量 */
  process: any;
  /**获取当前项目文件目录结构（包括node_modules中的） */
  _fs: FileData;
  [module: string]: Promise<any>;
}
